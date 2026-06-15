/**
 * extract-images.js — Extract question images from SSC CGL PYQ PDFs
 * v4: Clean approach — only assigns images to questions that ACTUALLY
 *     reference figures AND where the rendered crop is substantive.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const PYQ_DIR = path.resolve(__dirname, '../../PYQ');
const DATA_DIR = path.resolve(__dirname, '../data');
const IMAGES_DIR = path.resolve(DATA_DIR, 'images');
const QUESTIONS_FILE = path.resolve(DATA_DIR, 'questions.json');

// Only match questions that DEFINITELY reference a visual figure, table, or graph
const IMAGE_KEYWORDS = /\b(figure|diagram|embedded|mirror image|water image|paper\s*fold|unfold|complete the pattern|question figure|answer figure|problem figure|find the missing|number of triangles|number of squares|how many triangles|how many squares|counting\s*figure|table|graph|pie chart|bar graph|histogram|folding the given sheet|dices that can be formed)\b/i;

// Patterns that indicate the PDF text extractor dropped the math equation or statements
const SUSPICIOUS_PATTERNS = /solve the following|what is the value of \?|what will be the value of \?|if , then|which is\/are correct\?/i;

const MIN_IMAGE_SIZE = 5000; // 5KB minimum — anything smaller is likely blank

let pdfjsLib;

async function main() {
  pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  console.log('═══════════════════════════════════════════════');
  console.log('  SSC CGL PYQ Image Extractor v5 (Watermark Removal)');
  console.log('═══════════════════════════════════════════════\n');

  const questionsData = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
  const questions = questionsData.questions;

  // We do NOT clear ALL old image_url fields here because we have image-only PDFs that already set them.
  // We will only clear image_url for questions that are processed by this script.
  console.log(`  Loaded ${questions.length} questions\n`);

  // Ensure images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // STEP 2: Find questions needing images
  const imageQs = questions.filter(q => {
    // Check if it has the underline flag (mainly English questions)
    if (q.has_underline) return true;
    
    // Check if it's missing any options (e.g. Option D is blank)
    if (q.options && Object.values(q.options).some(opt => !opt || opt.trim() === '')) return true;

    // Ignore other English section questions to avoid false positives with words like "table"
    if (q.section === 'ENGLISH') return false;

    // Check for math/reasoning image keywords and suspicious short patterns
    return IMAGE_KEYWORDS.test(q.question_text) || 
           SUSPICIOUS_PATTERNS.test(q.question_text) || 
           q.question_text.length < 35;
  });
  console.log(`  ${imageQs.length} questions match image criteria\n`);

  // Group by source PDF
  const byPdf = {};
  for (const q of imageQs) {
    if (!q.source_pdf) continue;
    if (!byPdf[q.source_pdf]) byPdf[q.source_pdf] = [];
    byPdf[q.source_pdf].push(q);
  }

  let extracted = 0, skipped = 0, tooSmall = 0;
  const imageMap = {};

  for (const [pdfFile, pdfQuestions] of Object.entries(byPdf)) {
    const pdfPath = path.join(PYQ_DIR, pdfFile);
    if (!fs.existsSync(pdfPath)) {
      skipped += pdfQuestions.length;
      continue;
    }

    try {
      process.stdout.write(`  📄 ${pdfFile.substring(0, 50).padEnd(52)} `);
      
      const data = new Uint8Array(fs.readFileSync(pdfPath));
      const doc = await pdfjsLib.getDocument({ data }).promise;

      // Build page text index
      const pageIndex = [];
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const tc = await page.getTextContent();
        pageIndex.push({ pageNum: p, items: tc.items });
      }

      let pdfCount = 0;

      for (const q of pdfQuestions) {
        const imgFilename = sanitize(q.id) + '.png';
        const imgPath = path.join(IMAGES_DIR, imgFilename);

        // Find the page containing this question
        const foundPage = findQuestionPage(pageIndex, q.question_text);
        if (!foundPage) { skipped++; continue; }

        // Render the question region
        const page = await doc.getPage(foundPage.pageNum);
        const rendered = await renderQuestionRegion(doc, foundPage.pageNum, page, foundPage.items, q.question_text);
        
        if (!rendered) { skipped++; continue; }
        if (rendered.length < MIN_IMAGE_SIZE) { tooSmall++; continue; }

        fs.writeFileSync(imgPath, rendered);
        imageMap[q.id] = `data/images/${imgFilename}`;
        pdfCount++;
        extracted++;
      }

      console.log(`${pdfCount}/${pdfQuestions.length} images`);

    } catch (err) {
      console.log(`✗ ${err.message.substring(0, 50)}`);
      skipped += pdfQuestions.length;
    }
  }

  // STEP 3: Update questions.json — ONLY assign image_url to extracted questions
  for (const q of questions) {
    if (imageMap[q.id]) {
      q.image_url = imageMap[q.id];
      // Since the image captures the options too, we clear text options to rely on image
      // But keep A,B,C,D keys so logic works
      q.options = { A: 'A', B: 'B', C: 'C', D: 'D' };
    }
  }

  const withImages = questions.filter(q => q.image_url).length;
  questionsData.questions = questions;
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questionsData, null, 2), 'utf-8');

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  Image keyword matches: ${imageQs.length}`);
  console.log(`  Successfully extracted: ${extracted}`);
  console.log(`  Skipped (not found on page): ${skipped}`);
  console.log(`  Filtered (too small/blank): ${tooSmall}`);
  console.log(`  Total questions with images: ${withImages}`);
  console.log(`  ✓ Updated: ${QUESTIONS_FILE}`);
  console.log('═══════════════════════════════════════════════\n');
}

// Find the page containing a question's text using aggressive space-insensitive matching
function findQuestionPage(pageIndex, questionText) {
  const cleanTarget = questionText.toLowerCase().replace(/[^\w]/g, '').substring(0, 30);
  
  for (const pi of pageIndex) {
    const pageText = pi.items.map(i => i.str || '').join('').toLowerCase().replace(/[^\w]/g, '');
    if (pageText.includes(cleanTarget)) {
      return pi;
    }
  }
  return null;
}

// Render a cropped region of a PDF page around a question
async function renderQuestionRegion(doc, pageNum, page, textItems, questionText) {
  const SCALE = 2.0;
  const viewport = page.getViewport({ scale: SCALE });
  const pageHeight = page.getViewport({ scale: 1.0 }).height;

  const qSnippet = questionText.toLowerCase().replace(/[^\w]/g, '').substring(0, 20);
  let qYPdf = null;
  let qEndYPdf = null;
  
  let buffer = '';
  let startY = null;

  for (let i = 0; i < textItems.length; i++) {
    const item = textItems[i];
    if (!item.str || !item.transform) continue;
    
    const text = item.str.toLowerCase().replace(/[^\w]/g, '');
    if (!text) continue;

    if (buffer === '') startY = item.transform[5];
    buffer += text;
    
    if (buffer.includes(qSnippet)) {
      qYPdf = startY + 15;
      qEndYPdf = 0; // Default: Capture to bottom of page
      
      for (let j = i + 1; j < textItems.length; j++) {
        const next = textItems[j];
        if (!next.str || !next.transform) continue;
        const nextStr = next.str.trim();
        if (/^(Q\.?\s*\d+|Question\s*ID)/i.test(nextStr) && next.transform[5] < qYPdf - 40) {
          qEndYPdf = next.transform[5] + 20;
          break;
        }
      }
      break;
    }
    
    if (buffer.length > 50) {
      buffer = buffer.substring(buffer.length - 20);
      startY = item.transform[5];
    }
  }

  if (qYPdf === null) return null;

  const cropTop = Math.max(0, Math.floor((pageHeight - qYPdf) * SCALE));
  const cropBottom = Math.min(viewport.height, Math.floor((pageHeight - qEndYPdf) * SCALE));
  const currentCropHeight = cropBottom - cropTop;

  if (currentCropHeight < 40) return null;

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  let nextPageImage = null;
  let nextPageCropHeight = 0;

  if (qEndYPdf === 0 && pageNum < doc.numPages) {
    const nextPdfPage = await doc.getPage(pageNum + 1);
    const nv = nextPdfPage.getViewport({ scale: SCALE });
    const ncanvas = createCanvas(nv.width, nv.height);
    const nctx = ncanvas.getContext('2d');
    nctx.fillStyle = '#ffffff';
    nctx.fillRect(0, 0, nv.width, nv.height);
    await nextPdfPage.render({ canvasContext: nctx, viewport: nv }).promise;
    
    const ntc = await nextPdfPage.getTextContent();
    let nStopYPdf = 0;
    for (const nitem of ntc.items) {
      if (!nitem.str || !nitem.transform) continue;
      const nStr = nitem.str.trim();
      if (/^(Q\.?\s*\d+|Question\s*ID)/i.test(nStr)) {
         nStopYPdf = nitem.transform[5] + 20;
         break;
      }
    }
    
    const nPageHeight = nextPdfPage.getViewport({ scale: 1.0 }).height;
    if (nStopYPdf > 0) {
      const nCropBottom = Math.floor((nPageHeight - nStopYPdf) * SCALE);
      nextPageCropHeight = Math.max(0, nCropBottom);
    } else {
      nextPageCropHeight = Math.floor(nPageHeight * 0.4 * SCALE); // Default top 40% if no next question found
    }
    
    if (nextPageCropHeight > 0) {
      nextPageImage = ncanvas;
    }
  }

  const finalHeight = currentCropHeight + nextPageCropHeight;
  const croppedCanvas = createCanvas(viewport.width, finalHeight);
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.fillStyle = '#ffffff';
  croppedCtx.fillRect(0, 0, viewport.width, finalHeight);
  
  croppedCtx.drawImage(canvas, 0, cropTop, viewport.width, currentCropHeight, 0, 0, viewport.width, currentCropHeight);
  
  if (nextPageImage) {
      croppedCtx.drawImage(nextPageImage, 0, 0, viewport.width, nextPageCropHeight, 0, currentCropHeight, viewport.width, nextPageCropHeight);
  }

  // Watermarks are kept intact as requested by user.

  return croppedCanvas.toBuffer('image/png');
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
