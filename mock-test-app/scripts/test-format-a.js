const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');

async function testFormatA() {
  const filePath = 'E:/learn/SSC CGL/PYQ/SSC-CGL-Tier-1-Question-Paper-English_10.09.2024_12.30-PM-01.30-PM.pdf';
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({data, standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'}).promise;

  let totalFound = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const opList = await page.getOperatorList();

    // 1. Find all green checkmarks on this page using operator list!
    // The checkmark is a 16x16 image (or near that).
    const checkmarkYs = [];
    let lastTransform = null;
    let lastImgName = null;
    
    // Some PDFs might use different image names. Let's look for small square images.
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === pdfjsLib.OPS.transform) {
        lastTransform = opList.argsArray[i];
      }
      if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        lastImgName = opList.argsArray[i][0];
        const w = opList.argsArray[i][1];
        const h = opList.argsArray[i][2];
        if (lastTransform && w === 16 && h === 16) {
           checkmarkYs.push(lastTransform[5]);
        }
      }
    }

    // 2. Parse text items
    let qNum = null;
    let options = [];
    
    // Sort text items by Y coordinate (descending, top to bottom) and then X
    // Wait, tc.items is already mostly in reading order, but let's just process it as is.
    let currentY = null;
    let buffer = '';

    for (let i = 0; i < tc.items.length; i++) {
       const item = tc.items[i];
       if (!item.str) continue;
       const str = item.str.trim();
       if (!str) continue;

       const y = item.transform[5];
       
       if (/^Q\.?\s*\d+/.test(str)) {
          // Found a question
          qNum = parseInt(str.replace(/[^\d]/g, ''));
          totalFound++;
       }

       // Found an option number
       const optMatch = str.match(/^([1-4])\./);
       if (optMatch) {
          options.push({
            num: parseInt(optMatch[1]),
            y: y
          });
       }

       // Question boundary (either next question or Question ID section)
       if (options.length === 4 && (/^Question ID/i.test(str) || /^Q\.?\s*\d+/.test(tc.items[i+1]?.str))) {
          // We have all 4 options, find the correct one!
          let correctNum = null;
          let minDiff = 9999;
          
          for (const opt of options) {
            for (const cy of checkmarkYs) {
              const diff = Math.abs(opt.y - cy);
              if (diff < minDiff) {
                minDiff = diff;
                correctNum = opt.num;
              }
            }
          }
          
          if (minDiff < 10) {
            console.log(`Page ${p} - Q${qNum}: Correct Option is ${correctNum} (mapped with diff ${minDiff.toFixed(2)}pt)`);
          } else {
             // Maybe no checkmark found? Wait, some questions have no checkmark if the whole page is weird.
             console.log(`Page ${p} - Q${qNum}: WARNING - No close checkmark found. Closest is ${minDiff.toFixed(2)}pt`);
          }
          
          options = []; // reset for next question
       }
    }
  }

  console.log(`\nTotal questions found: ${totalFound}`);
}

testFormatA().catch(console.error);
