/**
 * extract-image-questions.js
 * 
 * Handles image-based PDFs (2019, 2020, some 2023) by:
 * 1. Rendering each PDF page as a high-res image
 * 2. Cropping question regions using Q.N text positions
 * 3. Detecting correct answers from radio button images
 * 4. Creating question entries with screenshot images
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const PYQ_DIR = path.resolve(__dirname, '..', '..', 'PYQ');
const IMAGES_DIR = path.resolve(__dirname, '..', 'data', 'images');
const QUESTIONS_FILE = path.resolve(__dirname, '..', 'data', 'questions.json');

const SECTION_ORDER = ['REASONING', 'GS', 'QUANT', 'ENGLISH'];
function assignSection(qNum) {
  if (qNum >= 1 && qNum <= 25) return SECTION_ORDER[0];
  if (qNum >= 26 && qNum <= 50) return SECTION_ORDER[1];
  if (qNum >= 51 && qNum <= 75) return SECTION_ORDER[2];
  if (qNum >= 76 && qNum <= 100) return SECTION_ORDER[3];
  return null;
}

function extractMeta(filename) {
  let year = null, shift = null;
  const ym = filename.match(/20(1[89]|2[0-5])/);
  if (ym) year = parseInt('20' + ym[1]);
  if (!year && /\d+-Dec-/i.test(filename)) year = 2024;
  const sm = filename.match(/Shift[\s-]*(\d)/i) || filename.match(/S(\d)-English/i);
  if (sm) shift = 'S' + sm[1];
  else if (/9[\s]*AM/i.test(filename)) shift = 'S1';
  else if (/11[\s:.]*45/i.test(filename)) shift = 'S1';
  else if (/12[\s:.]*30/i.test(filename)) shift = 'S2';
  else if (/2[\s:.]*30[\s]*PM/i.test(filename)) shift = 'S2';
  else if (/5[\s:.]*15[\s]*PM/i.test(filename)) shift = 'S3';
  return { year, shift };
}

async function identifyImagePDFs(pdfjsLib) {
  const files = fs.readdirSync(PYQ_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .filter(f => !/\(\d+\)\.pdf$/i.test(f))
    .sort();
  
  const imagePDFs = [];
  
  for (const f of files) {
    const data = new Uint8Array(fs.readFileSync(path.join(PYQ_DIR, f)));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    
    let hasChosenOption = false;
    let longTextItems = 0;
    
    for (let p = 1; p <= Math.min(5, doc.numPages); p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      for (const item of tc.items) {
        if (!item.str || !item.str.trim()) continue;
        const s = item.str.trim();
        if (/Chosen Option/i.test(s)) hasChosenOption = true;
        if (s.length > 30 && !/Question ID|Status|Chosen Option|Combined Graduate|Roll Number|Candidate|Venue|Exam Date|Exam Time|Subject|Section/i.test(s)) {
          longTextItems++;
        }
      }
    }
    
    // Image-based if it has Chosen Option but very few long text items
    if (hasChosenOption && longTextItems < 10) {
      imagePDFs.push(f);
    }
  }
  
  return imagePDFs;
}

async function processImagePDF(filePath, filename, pdfjsLib) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({
    data,
    standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'
  }).promise;
  
  const SCALE = 2.0;
  const questions = [];
  let globalQNum = 0;
  
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const opList = await page.getOperatorList();
    const viewport = page.getViewport({ scale: SCALE });
    const pdfH = viewport.height / SCALE;
    
    const items = tc.items.filter(it => it.str && it.str.trim());
    
    // ── Find question starts and option positions ──
    const qBlocks = [];
    let curQ = null;
    
    for (let i = 0; i < items.length; i++) {
      const s = items[i].str.trim();
      const y = items[i].transform[5];
      
      // Q.N marker
      const qm = s.match(/^Q\.?\s*(\d+)$/i);
      if (qm && !/question id/i.test(s)) {
        if (curQ) qBlocks.push(curQ);
        curQ = {
          localNum: parseInt(qm[1]),
          yTop: y + 15, // A bit above Q
          yBottom: null,
          optionYs: [],
          chosenOption: null
        };
      }
      
      // Option markers: "1." "2." "3." "4."
      if (curQ && /^[1-4]\.$/.test(s)) {
        curQ.optionYs.push({ num: parseInt(s[0]), y });
      }
      
      // Chosen Option value
      if (curQ && /^[1-4]$/.test(s) && i > 0) {
        const prev = items[i-1]?.str?.trim() || '';
        const prevPrev = items[i-2]?.str?.trim() || '';
        if (/Chosen Option/i.test(prev) || /Chosen Option/i.test(prevPrev)) {
          curQ.chosenOption = parseInt(s);
        }
      }
    }
    if (curQ) qBlocks.push(curQ);
    
    if (qBlocks.length === 0) continue;
    
    // Set yBottom for each Q (above next Q, or bottom of page)
    for (let i = 0; i < qBlocks.length; i++) {
      if (i + 1 < qBlocks.length) {
        qBlocks[i].yBottom = qBlocks[i+1].yTop + 20;
      } else {
        qBlocks[i].yBottom = 0;
      }
    }
    
    // ── Detect correct answers from radio button images ──
    // 31x21 images: the "minority" image name per question = correct answer
    let lastT = null;
    const radioImgs = []; // { name, y }
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === pdfjsLib.OPS.transform) lastT = opList.argsArray[i];
      if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        if (!lastT) continue;
        const w = opList.argsArray[i][1], h = opList.argsArray[i][2];
        if (w === 31 && h === 21) {
          radioImgs.push({ name: opList.argsArray[i][0], y: lastT[5] });
        }
      }
    }
    
    // Also check for square checkmarks (14-24px, used in 2021+ papers)
    lastT = null;
    const checkmarkYs = [];
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === pdfjsLib.OPS.transform) lastT = opList.argsArray[i];
      if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        if (!lastT) continue;
        const w = opList.argsArray[i][1], h = opList.argsArray[i][2];
        if (w === h && w >= 14 && w <= 24) {
          checkmarkYs.push(lastT[5]);
        }
      }
    }
    
    // Match correct answers to each Q block
    for (const qb of qBlocks) {
      // Method 1: Radio button analysis (for 2019/2020)
      if (radioImgs.length > 0 && qb.optionYs.length >= 2) {
        // Find radio buttons within this Q's Y range
        const qRadios = [];
        for (const ri of radioImgs) {
          // Match to closest option
          let closestOpt = null, minDiff = 999;
          for (const opt of qb.optionYs) {
            const d = Math.abs(opt.y - ri.y);
            if (d < minDiff) { minDiff = d; closestOpt = opt; }
          }
          if (closestOpt && minDiff < 15) {
            qRadios.push({ name: ri.name, optNum: closestOpt.num });
          }
        }
        
        if (qRadios.length >= 2) {
          // Count image names: the one that appears once = correct
          const nameCounts = {};
          for (const r of qRadios) nameCounts[r.name] = (nameCounts[r.name] || 0) + 1;
          const sortedNames = Object.entries(nameCounts).sort((a, b) => a[1] - b[1]);
          if (sortedNames.length >= 2 && sortedNames[0][1] === 1) {
            // The least-frequent image = correct answer marker
            const correctName = sortedNames[0][0];
            const correctRadio = qRadios.find(r => r.name === correctName);
            if (correctRadio) {
              qb.correctOption = correctRadio.optNum;
            }
          }
        }
      }
      
      // Method 2: Square checkmark matching (for 2021+ papers)
      if (!qb.correctOption && checkmarkYs.length > 0 && qb.optionYs.length >= 2) {
        let bestDiff = Infinity, bestOpt = null;
        for (const opt of qb.optionYs) {
          for (const cy of checkmarkYs) {
            const d = Math.abs(opt.y - cy);
            if (d < bestDiff) { bestDiff = d; bestOpt = opt.num; }
          }
        }
        if (bestDiff <= 30) {
          qb.correctOption = bestOpt;
        }
      }
    }
    
    // ── Render page and crop each question ──
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    
    for (const qb of qBlocks) {
      globalQNum++;
      
      // Convert PDF coords to canvas coords (PDF Y origin at bottom)
      const yTopCanvas = Math.max(0, Math.round((pdfH - qb.yTop) * SCALE));
      const yBottomCanvas = Math.min(viewport.height, Math.round((pdfH - qb.yBottom) * SCALE));
      const cropH = yBottomCanvas - yTopCanvas;
      
      if (cropH < 30) continue;
      
      // Crop the question region
      const cropCanvas = createCanvas(viewport.width, cropH);
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx.drawImage(canvas, 0, yTopCanvas, viewport.width, cropH, 0, 0, viewport.width, cropH);
      
      // Save image
      const imgFilename = `${filename.replace(/\.pdf$/i, '')}_Q${String(globalQNum).padStart(3, '0')}.png`;
      const imgPath = path.join(IMAGES_DIR, imgFilename);
      fs.writeFileSync(imgPath, cropCanvas.toBuffer('image/png'));
      
      const correctLetter = qb.correctOption ? ['A', 'B', 'C', 'D'][qb.correctOption - 1] : null;
      
      let sectionVal = assignSection(globalQNum);
      let topicVal = null;
      if (!correctLetter) {
        sectionVal = 'MISC';
        topicVal = 'MISC_UNANSWERED';
        miscCount++;
      } else {
        topicVal = detectTopic(qb.questionText || '', sectionVal);
      }
      
      questions.push({
        id: `${filename.replace(/\.pdf$/i, '')}-Q${String(globalQNum).padStart(3, '0')}`,
        _qNum: globalQNum,
        section: sectionVal,
        topic: topicVal,
        source_pdf: filename,
        question_text: `[Image-based Question ${globalQNum}]`,
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        correct_option: correctLetter,
        explanation: null,
        image_url: `data/images/${imgFilename}`
      });
    }
  }
  
  return questions;
}

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  console.log('═══════════════════════════════════════════════');
  console.log('  Image Question Extractor');
  console.log('═══════════════════════════════════════════════\n');
  
  // Step 1: Identify image-based PDFs
  console.log('  Step 1: Identifying image-based PDFs...');
  const imagePDFs = await identifyImagePDFs(pdfjsLib);
  console.log(`  Found ${imagePDFs.length} image-based PDFs:\n`);
  for (const f of imagePDFs) console.log(`    ${f}`);
  
  if (imagePDFs.length === 0) {
    console.log('  No image-based PDFs found.');
    return;
  }
  
  // Ensure images dir exists
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  
  // Step 2: Process each PDF
  console.log('\n  Step 2: Processing PDFs...\n');
  const allNewQuestions = [];
  
  for (const f of imagePDFs) {
    console.log(`  📄 ${f}`);
    const { year, shift } = extractMeta(f);
    
    try {
      const qs = await processImagePDF(path.join(PYQ_DIR, f), f, pdfjsLib);
      for (const q of qs) { q.year = year; q.shift = shift; }
      
      const withAnswer = qs.filter(q => q.correct_option).length;
      for (const q of qs) {
        if (!q.correct_option) q.section = 'MISC';
      }
      console.log(`     → ${qs.length} questions, ${withAnswer} with correct answer, ${qs.length - withAnswer} moved to MISC`);
      allNewQuestions.push(...qs);
    } catch (err) {
      console.error(`     ✗ Error: ${err.message}`);
    }
  }
  
  // Step 3: Merge into questions.json
  console.log('\n  Step 3: Merging into questions.json...');
  const existing = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
  
  // Include all questions, even those without correct answers (they are now in MISC section)
  const validNew = allNewQuestions;
  for (const q of validNew) delete q._qNum;
  
  console.log(`  Total image questions: ${allNewQuestions.length}`);
  console.log(`  With correct answer: ${allNewQuestions.filter(q=>q.correct_option).length}`);
  console.log(`  Without answer (moved to MISC): ${allNewQuestions.filter(q=>!q.correct_option).length}`);
  
  // Remove any existing image questions (re-run safe)
  const existingNonImage = existing.questions.filter(q => !q.image_url);
  existingNonImage.push(...validNew);
  
  existing.questions = existingNonImage;
  existing.total = existing.questions.length;
  existing.generated_at = new Date().toISOString();
  
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  
  // Stats
  const byYear = {};
  for (const q of validNew) byYear[q.year || '?'] = (byYear[q.year || '?'] || 0) + 1;
  
  console.log('\n  Image questions by year:');
  for (const [y, c] of Object.entries(byYear).sort()) console.log(`    ${y}: ${c}`);
  
  console.log(`\n  ✓ Total questions in DB: ${existing.total}`);
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err.stack); process.exit(1); });
