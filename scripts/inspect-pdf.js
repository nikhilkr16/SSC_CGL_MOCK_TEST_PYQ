/**
 * Quick inspect: dump answer-area text from official SSC PDFs
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const PYQ_DIR = path.resolve(__dirname, '..', '..', 'PYQ');

  // Check different PDF types
  const testFiles = [
    'SSC-CGL-QUESTION-PAPER-04-June-2019-Shift-2-English.pdf',
    'SSC-CGL-Tier-1-Question-Paper-English_09.09.2024_12.30-PM-01.30-PM.pdf',
    'SSC-CGL-T-I-Similar-Paper-Held-on-12-Sep-2025-S1-English.pdf',
    '1-Dec-11.45PM-EN-Question-Paper.pdf'
  ];

  for (const filename of testFiles) {
    const filePath = path.join(PYQ_DIR, filename);
    if (!fs.existsSync(filePath)) continue;

    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const numPages = doc.numPages;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`${filename} (${numPages} pages)`);
    console.log(`${'='.repeat(70)}`);

    // Check LAST 3 pages for answer keys
    for (let p = Math.max(1, numPages - 2); p <= numPages; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      
      console.log(`\n--- Page ${p}/${numPages} ---`);
      const lines = [];
      let lastY = null, buf = [];
      for (const item of tc.items) {
        if (!item.str || !item.str.trim()) continue;
        const y = item.transform ? Math.round(item.transform[5]) : 0;
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          if (buf.length) lines.push(buf.join(' '));
          buf = [item.str.trim()];
        } else {
          buf.push(item.str.trim());
        }
        lastY = y;
      }
      if (buf.length) lines.push(buf.join(' '));
      
      lines.forEach(l => console.log(`  ${l}`));
    }

    // Also check first 2 pages for structure
    console.log(`\n--- Page 1 (first 40 lines) ---`);
    const pg1 = await doc.getPage(1);
    const tc1 = await pg1.getTextContent();
    const lines1 = [];
    let lastY1 = null, buf1 = [];
    for (const item of tc1.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = item.transform ? Math.round(item.transform[5]) : 0;
      if (lastY1 !== null && Math.abs(y - lastY1) > 5) {
        if (buf1.length) lines1.push(buf1.join(' '));
        buf1 = [item.str.trim()];
      } else {
        buf1.push(item.str.trim());
      }
      lastY1 = y;
    }
    if (buf1.length) lines1.push(buf1.join(' '));
    lines1.slice(0, 40).forEach(l => console.log(`  ${l}`));

    // Check for green color on page 1
    console.log(`\n--- Color analysis (page 1) ---`);
    try {
      const opList = await pg1.getOperatorList();
      const ops = opList.fnArray;
      const args = opList.argsArray;
      const colorOps = new Set();
      for (let i = 0; i < ops.length; i++) {
        if (ops[i] >= 28 && ops[i] <= 40) {
          const a = args[i];
          if (a) colorOps.add(`op${ops[i]}(${Array.isArray(a) ? a.slice(0,4).map(v => typeof v === 'number' ? v.toFixed(3) : String(v)).join(',') : String(a)})`);
        }
      }
      console.log(`  Unique color ops: ${[...colorOps].join(' | ') || 'NONE'}`);
    } catch(e) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

main().catch(console.error);
