/**
 * Diagnostic script to understand why questions are being lost.
 * Reports per-PDF: total parsed, valid, skipped (and WHY skipped).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PYQ_DIR = path.resolve(__dirname, '..', '..', 'PYQ');

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const files = fs.readdirSync(PYQ_DIR).filter(f => f.toLowerCase().endsWith('.pdf')).sort();
  console.log(`Total PDFs: ${files.length}\n`);

  let grandTotal = 0;
  let grandParsed = 0;
  let grandNoCorrect = 0;
  let grandTooShort = 0;
  let grandNoQ = 0;

  const problemFiles = [];

  for (const file of files) {
    try {
      const filePath = path.join(PYQ_DIR, file);
      const data = new Uint8Array(fs.readFileSync(filePath));
      const doc = await pdfjsLib.getDocument({ data }).promise;

      // Extract all text
      const allText = [];
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const tc = await page.getTextContent();
        for (const item of tc.items) {
          if (item.str && item.str.trim()) allText.push(item.str.trim());
        }
      }
      const fullText = allText.join(' ');

      // Detect format
      let format = 'D';
      if (/Chosen Option/i.test(fullText)) format = 'A';
      else if (/Ans[\.\s]*\([a-d]\)/i.test(fullText)) format = 'B';
      else if (/\d+\.\s*\(\s*[a-d]\s*\)\s+\w/i.test(fullText) && /Yearwise|Solved Paper/i.test(fullText)) format = 'C';
      else if (/answer\s*key/i.test(fullText)) format = 'D';
      else if (/\(\s*[a-d]\s*\)/i.test(fullText)) format = 'C';

      // Count Q numbers found
      const qNums = new Set();
      for (const t of allText) {
        const m = t.match(/^Q\.?\s*(\d+)/i);
        if (m && !t.toLowerCase().includes('question id')) qNums.add(parseInt(m[1]));
      }

      // Check for "Correct Option" or "Right Answer" text
      const hasCorrectOption = /Correct Option|Right Answer/i.test(fullText);
      const hasChosenOption = /Chosen Option/i.test(fullText);
      
      // Count "Chosen Option" lines with actual values vs blank
      let chosenWithValue = 0;
      let chosenBlank = 0;
      for (const t of allText) {
        if (/Chosen Option\s*:\s*(\d)/i.test(t)) chosenWithValue++;
        else if (/Chosen Option\s*:\s*--/i.test(t) || /Chosen Option\s*:\s*$/i.test(t)) chosenBlank++;
      }

      // Check for green checkmark images
      let checkmarkCount = 0;
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const opList = await page.getOperatorList();
        let lastTransform = null;
        for (let i = 0; i < opList.fnArray.length; i++) {
          if (opList.fnArray[i] === pdfjsLib.OPS.transform) lastTransform = opList.argsArray[i];
          if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
            const w = opList.argsArray[i][1];
            const h = opList.argsArray[i][2];
            if (lastTransform && w === h && w >= 14 && w <= 24) checkmarkCount++;
          }
        }
      }
      
      // Check for "Correct Option" text  
      let correctOptionCount = 0;
      for (const t of allText) {
        if (/Correct Option\s*:\s*(\d)/i.test(t)) correctOptionCount++;
      }

      const status = qNums.size < 90 ? '❌' : '✅';
      
      console.log(`${status} ${file}`);
      console.log(`   Format: ${format} | Pages: ${doc.numPages} | Q numbers found: ${qNums.size}`);
      console.log(`   Chosen w/value: ${chosenWithValue} | Chosen blank: ${chosenBlank} | Checkmarks: ${checkmarkCount} | CorrectOpt text: ${correctOptionCount}`);
      
      if (qNums.size < 90) {
        console.log(`   ⚠️  PROBLEM: Only ${qNums.size} question numbers detected`);
        // Sample first few text items
        console.log(`   First text items: ${allText.slice(0, 10).join(' | ')}`);
        problemFiles.push({ file, format, qNums: qNums.size, checkmarks: checkmarkCount, chosenWithValue, correctOptionCount });
      }
      
      if (qNums.size >= 90 && checkmarkCount === 0 && chosenWithValue === 0 && correctOptionCount === 0) {
        console.log(`   ⚠️  PROBLEM: Questions found but NO correct answer source (no checkmarks, no chosen option, no correct option text)`);
        problemFiles.push({ file, format, qNums: qNums.size, checkmarks: checkmarkCount, chosenWithValue, correctOptionCount });
      }

      grandTotal += 100; // expected
      grandParsed += qNums.size;
      console.log('');
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}\n`);
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`Expected total: ${files.length * 100}`);
  console.log(`Question numbers detected: ${grandParsed}`);
  console.log(`Problem files: ${problemFiles.length}`);
  console.log('═══════════════════════════════════════════════\n');

  if (problemFiles.length > 0) {
    console.log('Problem file summary:');
    for (const pf of problemFiles) {
      console.log(`  ${pf.file}`);
      console.log(`    Format=${pf.format}, Qs=${pf.qNums}, Checkmarks=${pf.checkmarks}, ChosenValues=${pf.chosenWithValue}, CorrectOptText=${pf.correctOptionCount}`);
    }
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
