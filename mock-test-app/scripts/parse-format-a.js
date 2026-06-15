/**
 * parse-format-a.js — Format A parser with vector-based checkmark scanner
 * 
 * Handles 2021-2024 "response sheet" PDFs where:
 *   - Questions start with Q.N
 *   - Options follow after "Ans" line: 1. text  2. text  3. text  4. text
 *   - Correct answer is indicated by a green checkmark IMAGE (not text)
 *   - The green checkmark is a square image (14-24px) rendered via paintImageXObject
 *   - We match checkmark Y-coords to option Y-coords to determine correct answer
 */

'use strict';

const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');

// Section header patterns
const SECTION_HEADERS = [
  { regex: /^Section\s*[:\-]\s*(.*General Intelligence.*|.*Reasoning.*)/i, section: 'REASONING' },
  { regex: /^Section\s*[:\-]\s*(.*General Awareness.*|.*General Knowledge.*|.*General Studies.*)/i, section: 'GS' },
  { regex: /^Section\s*[:\-]\s*(.*Quantitative Aptitude.*|.*Mathematics.*|.*Mathematical Ability.*)/i, section: 'QUANT' },
  { regex: /^Section\s*[:\-]\s*(.*English.*|.*Language Comprehension.*)/i, section: 'ENGLISH' },
  // Fallback for lines that are exactly the section name without "Section:"
  { regex: /^(General Intelligence and Reasoning|General Intelligence|Reasoning|Reasoning Ability)$/i, section: 'REASONING' },
  { regex: /^(General Awareness|General Knowledge|General Studies)$/i, section: 'GS' },
  { regex: /^(Quantitative Aptitude|Mathematics|Mathematical Ability)$/i, section: 'QUANT' },
  { regex: /^(English Comprehension|English Language|English|Language Comprehension)$/i, section: 'ENGLISH' },
];

const DEFAULT_SECTION_ORDER = ['REASONING', 'GS', 'QUANT', 'ENGLISH'];

function assignSectionByQNum(qNum, sectionOrder) {
  const order = sectionOrder.length === 4 ? sectionOrder : DEFAULT_SECTION_ORDER;
  if (qNum >= 1 && qNum <= 25) return order[0];
  if (qNum >= 26 && qNum <= 50) return order[1];
  if (qNum >= 51 && qNum <= 75) return order[2];
  if (qNum >= 76 && qNum <= 100) return order[3];
  return null;
}

async function parseFormatAVector(filePath, filename, year, shift) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({
    data,
    standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'
  }).promise;

  const questions = [];
  let currentSection = null;
  const sectionOrder = [];
  const seenSections = new Set();
  
  // Running question counter (since Q numbers restart per section in some papers)
  let globalQCounter = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const opList = await page.getOperatorList();

    // ── Step 1: Find ALL checkmark images on this page ──
    const checkmarkYs = [];
    let lastTransform = null;
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === pdfjsLib.OPS.transform) {
        lastTransform = opList.argsArray[i];
      }
      if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        if (!lastTransform) continue;
        const w = opList.argsArray[i][1];
        const h = opList.argsArray[i][2];
        // Green checkmark is a small perfect square (14-24px)
        if (w === h && w >= 14 && w <= 24) {
          checkmarkYs.push(lastTransform[5]);
        }
      }
    }

    // ── Step 2: Process text items to extract questions ──
    const items = tc.items.filter(it => it.str && it.str.trim());
    let i = 0;

    while (i < items.length) {
      const str = items[i].str.trim();
      const y = items[i].transform[5];

      // Section detection
      for (const sh of SECTION_HEADERS) {
        if (sh.regex.test(str) && str.length < 120) {
          currentSection = sh.section;
          if (!seenSections.has(sh.section)) {
            seenSections.add(sh.section);
            sectionOrder.push(sh.section);
          }
          break;
        }
      }

      // ── Detect question start: "Q.N" or "Q N" ──
      const qMatch = str.match(/^Q\.?\s*(\d+)/i);
      if (qMatch && !str.toLowerCase().includes('question id')) {
        const localQNum = parseInt(qMatch[1]);
        globalQCounter++;
        
        // Use globalQCounter for section assignment, localQNum for display
        const effectiveQNum = globalQCounter;
        
        // Collect question text (everything after Q.N on this item)
        let qText = str.replace(/^Q\.?\s*\d+\s*/i, '').trim();
        i++;

        // Collect question text until "Ans" or next Q
        while (i < items.length) {
          const s = items[i].str.trim();
          if (/^Ans\b/i.test(s)) break;
          if (/^Q\.?\s*\d+/i.test(s) && !s.toLowerCase().includes('question id')) break;
          // Skip metadata
          if (/^(SubQuestion|Comprehension:|Combined Graduate|Roll Number|Candidate Name|Venue Name|Exam Date|Exam Time|Subject |Section\s*:)/i.test(s)) {
            // But detect section from metadata
            for (const sh of SECTION_HEADERS) {
              if (sh.regex.test(s)) {
                currentSection = sh.section;
                if (!seenSections.has(sh.section)) {
                  seenSections.add(sh.section);
                  sectionOrder.push(sh.section);
                }
              }
            }
            i++; continue;
          }
          qText += ' ' + s;
          i++;
        }

        // ── Parse options ──
        const options = [];
        if (i < items.length && /^Ans\b/i.test(items[i].str.trim())) {
          i++; // skip "Ans"
          
          let currentOptNum = null;
          let currentOptText = '';
          let currentOptY = 0;

          while (i < items.length) {
            const s = items[i].str.trim();
            
            // Stop at Question ID, Status, next Q, or Chosen Option
            if (/^Question ID/i.test(s) || /^Status\b/i.test(s) || 
                /^Chosen Option/i.test(s) || /^Option \d+ ID/i.test(s) ||
                (/^Q\.?\s*\d+/i.test(s) && !s.toLowerCase().includes('question id'))) {
              break;
            }

            // New option: "1." or "1. text" or just "1"
            const optNumMatch = s.match(/^([1-4])\.?\s*(.*)/);
            if (optNumMatch && parseInt(optNumMatch[1]) === (currentOptNum === null ? 1 : currentOptNum + 1) || 
                (optNumMatch && currentOptNum === null)) {
              // Save previous option
              if (currentOptNum !== null) {
                options.push({ num: currentOptNum, text: currentOptText.trim(), y: currentOptY });
              }
              currentOptNum = parseInt(optNumMatch[1]);
              currentOptText = (optNumMatch[2] || '').trim();
              currentOptY = items[i].transform[5];
            } else if (currentOptNum !== null) {
              // Continuation of current option text
              currentOptText += ' ' + s;
            }
            i++;
          }
          // Push last option
          if (currentOptNum !== null) {
            options.push({ num: currentOptNum, text: currentOptText.trim(), y: currentOptY });
          }
        }

        // ── Skip metadata until next Q ──
        while (i < items.length) {
          const s = items[i].str.trim();
          if (/^Q\.?\s*\d+/i.test(s) && !s.toLowerCase().includes('question id')) break;
          if (/^Section\s*:/i.test(s)) break;
          // Also detect section headers
          for (const sh of SECTION_HEADERS) {
            if (sh.regex.test(s) && s.length < 120) {
              currentSection = sh.section;
              if (!seenSections.has(sh.section)) {
                seenSections.add(sh.section);
                sectionOrder.push(sh.section);
              }
            }
          }
          i++;
        }

        // ── Match checkmark to correct option ──
        let correctOpt = null;
        if (options.length >= 2 && checkmarkYs.length > 0) {
          let bestDiff = Infinity;
          let bestOpt = null;
          
          for (const opt of options) {
            for (const cy of checkmarkYs) {
              const diff = Math.abs(opt.y - cy);
              if (diff < bestDiff) {
                bestDiff = diff;
                bestOpt = opt.num;
              }
            }
          }
          
          // Tolerance: 30pt (covers 99.9%+ of checkmark-option alignments)
          if (bestDiff <= 30 && bestOpt >= 1 && bestOpt <= 4) {
            correctOpt = ['A', 'B', 'C', 'D'][bestOpt - 1];
          }
        }

        // ── Build options object ──
        const optObj = { A: '', B: '', C: '', D: '' };
        for (const o of options) {
          if (o.num >= 1 && o.num <= 4) {
            optObj[['A', 'B', 'C', 'D'][o.num - 1]] = o.text;
          }
        }

        // ── Determine section ──
        let qSection = currentSection || assignSectionByQNum(effectiveQNum, sectionOrder);

        questions.push({
          id: `${filename.replace(/\.pdf$/i, '')}-Q${String(effectiveQNum).padStart(3, '0')}`,
          _qNum: effectiveQNum,
          section: qSection,
          topic: null,
          year, shift,
          source_pdf: filename,
          question_text: qText.trim(),
          options: optObj,
          correct_option: correctOpt,
          explanation: null
        });

        continue; // don't increment i, we're already positioned at next Q or end
      }
      i++;
    }
  }
  return questions;
}

module.exports = parseFormatAVector;
