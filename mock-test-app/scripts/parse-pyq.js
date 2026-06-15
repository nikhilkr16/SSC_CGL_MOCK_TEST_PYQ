/**
 * SSC CGL PYQ PDF Parser v2
 * ──────────────────────────────────────────────────────────────
 * Handles multiple PDF formats:
 *
 * FORMAT A (2024 Official Response Sheets):
 *   Q.1 question text...
 *   Ans 1. option1   2. option2   3. option3   4. option4
 *   Question ID : ...
 *   Status : Answered
 *   Chosen Option : X      ← correct answer is "Chosen Option"
 *
 * FORMAT B (2025 Similar Papers):
 *   Q1. question text
 *   (a) opt (b) opt (c) opt (d) opt
 *   Ans. (c) ← answer key line
 *
 * FORMAT C (Yearwise/Book PDFs):
 *   1. ( a ) option1  ( b ) option2  ( c ) option3  ( d ) option4
 *   Answer section: 41. ( d ) explanation text...
 *
 * FORMAT D (2019-2021 Official Papers):
 *   Q. 1. question text
 *   (A) option (B) option (C) option (D) option
 *   Answer key section at end with: 1-A, 2-B, etc
 *
 * Usage: node scripts/parse-pyq.js
 * Output: data/questions.json
 */

'use strict';

const fs = require('fs');
const path = require('path');
const parseFormatAVector = require('./parse-format-a.js');

let pdfjsLib;

const PYQ_DIR = path.resolve(__dirname, '..', '..', 'PYQ');
const OUTPUT_FILE = path.resolve(__dirname, '..', 'data', 'questions.json');

// ── Topic keyword map ───────────────────────────────────────
const TOPIC_KEYWORDS = {
  QUANT_NUMBER_SYSTEM: ['lcm', 'hcf', 'divisible', 'divisibility', 'factor', 'remainder', 'fraction', 'decimal', 'prime', 'integer', 'natural number', 'whole number'],
  QUANT_PERCENTAGE: ['percent', '%', 'percentage'],
  QUANT_RATIO_PROPORTION: ['ratio', 'proportion', 'proportional', 'mean proportional'],
  QUANT_AVERAGE: ['average', 'weighted average'],
  QUANT_INTEREST: ['simple interest', 'compound interest', 'rate of interest', 'principal', 'per annum'],
  QUANT_PROFIT_LOSS: ['profit', 'loss', 'selling price', 'cost price', 'discount', 'marked price'],
  QUANT_MIXTURE_ALLEGATION: ['mixture', 'alligation', 'concentration'],
  QUANT_TIME_DISTANCE: ['speed', 'distance', 'train', 'boat', 'upstream', 'downstream', 'km/h', 'km/hr', 'm/s', 'overtake'],
  QUANT_TIME_WORK: ['work', 'pipe', 'cistern', 'fill', 'empty', 'efficiency'],
  QUANT_ALGEBRA: ['polynomial', 'equation', 'identity', 'surd', 'quadratic', 'simplify', 'value of', 'expression', 'algebra', 'if x', 'x +', 'x²', 'x³'],
  QUANT_GEOMETRY: ['triangle', 'circle', 'angle', 'perpendicular', 'bisector', 'tangent', 'chord', 'diameter', 'radius', 'congruent', 'similar', 'quadrilateral', 'rhombus', 'trapezium', 'parallelogram', 'centroid', 'orthocentre', 'incentre', 'circumcentre', 'geometry'],
  QUANT_MENSURATION: ['area', 'volume', 'surface area', 'perimeter', 'circumference', 'cuboid', 'cylinder', 'cone', 'sphere', 'hemisphere', 'prism', 'pyramid', 'mensuration'],
  QUANT_TRIGONOMETRY: ['sin', 'cos', 'tan', 'cosec', 'sec', 'cot', 'trigonometr', 'angle of elevation', 'angle of depression', 'height and distance'],
  QUANT_STATISTICS: ['median', 'mode', 'range', 'bar graph', 'pie chart', 'histogram', 'frequency', 'standard deviation', 'data interpretation'],
  QUANT_SQUARE_ROOT: ['square root', 'cube root', 'perfect square', 'perfect cube'],
  REASON_ANALOGY: ['is related to', '::', 'analogy', 'in the same way', 'related pair'],
  REASON_CLASSIFICATION: ['odd one', 'does not belong', 'different from', 'odd man', 'which one is different'],
  REASON_SERIES: ['next term', 'next number', 'series', 'sequence', 'missing number', 'what comes next', 'wrong number'],
  REASON_CODING_DECODING: ['coded as', 'coding', 'decoding', 'certain code'],
  REASON_BLOOD_RELATION: ['brother', 'sister', 'father', 'mother', 'son', 'daughter', 'uncle', 'aunt', 'nephew', 'niece', 'blood relation', 'husband', 'wife', 'grandfather', 'grandmother'],
  REASON_DIRECTION_DISTANCE: ['north', 'south', 'east', 'west', 'direction', 'left turn', 'right turn', 'facing', 'starting point'],
  REASON_RANKING_ARRANGEMENT: ['rank', 'position', 'seating', 'arrangement'],
  REASON_SYLLOGISM: ['statement', 'conclusion', 'assumption', 'syllogism'],
  REASON_VENN_DIAGRAM: ['venn', 'best represent'],
  REASON_MATRIX: ['matrix'],
  REASON_FIGURE_COUNTING: ['how many triangles', 'how many squares', 'count the', 'number of triangles'],
  REASON_PAPER_FOLDING: ['paper', 'fold', 'punch', 'unfold'],
  REASON_MIRROR_WATER: ['mirror', 'water image', 'reflection'],
  REASON_EMBEDDED_FIGURE: ['embedded', 'hidden figure'],
  REASON_PATTERN_COMPLETION: ['pattern', 'complete the', 'missing figure'],
  REASON_MATHEMATICAL_OPS: ['interchange', 'replace sign', 'mathematical operation'],
  REASON_DICE_CUBE: ['dice', 'cube', 'opposite face'],
  GS_HISTORY: ['battle', 'dynasty', 'mughal', 'maurya', 'gupta', 'empire', 'ruler', 'movement', 'revolt', 'independence', 'freedom fighter', 'gandhi', 'nehru', 'british', 'vedic', 'harappa', 'indus'],
  GS_POLITY: ['constitution', 'article', 'amendment', 'fundamental', 'parliament', 'lok sabha', 'rajya sabha', 'president', 'governor', 'supreme court', 'high court', 'panchayat', 'judiciary'],
  GS_GEOGRAPHY: ['river', 'mountain', 'plateau', 'ocean', 'continent', 'latitude', 'longitude', 'climate', 'monsoon', 'earthquake', 'volcano', 'soil', 'mineral', 'peninsula'],
  GS_ECONOMY: ['gdp', 'inflation', 'budget', 'tax', 'fiscal', 'monetary', 'rbi', 'reserve bank', 'niti', 'subsidy', 'fdi', 'gst', 'economy'],
  GS_SCIENCE_PHYSICS: ['force', 'motion', 'gravity', 'newton', 'energy', 'electric', 'current', 'resistance', 'voltage', 'magnet', 'wave', 'sound', 'light', 'lens', 'refraction', 'nucleus', 'pressure', 'momentum'],
  GS_SCIENCE_CHEMISTRY: ['element', 'compound', 'acid', 'base', 'salt', 'ph', 'periodic', 'chemical', 'reaction', 'oxidation', 'reduction', 'alloy', 'corrosion', 'polymer', 'molecule'],
  GS_SCIENCE_BIOLOGY: ['cell', 'blood', 'heart', 'liver', 'kidney', 'brain', 'vitamin', 'protein', 'enzyme', 'dna', 'gene', 'chromosome', 'disease', 'virus', 'bacteria', 'photosynthesis', 'hormone', 'vaccine'],
  GS_ENVIRONMENT: ['environment', 'ecology', 'ecosystem', 'biodiversity', 'pollution', 'greenhouse', 'ozone', 'global warming', 'wildlife', 'national park', 'sanctuary', 'conservation'],
  GS_CURRENT_AFFAIRS: ['award', 'prize', 'tournament', 'champion', 'medal', 'summit', 'conference', 'launched', 'minister', 'appointed', 'inaugurat', 'yojana', 'abhiyan'],
  GS_CULTURE_ART: ['dance', 'music', 'painting', 'festival', 'temple', 'folk', 'classical', 'raga', 'instrument', 'heritage', 'unesco', 'sculpture', 'architecture'],
  GS_COMPUTER_IT: ['computer', 'software', 'hardware', 'internet', 'ram', 'rom', 'cpu', 'binary', 'programming', 'algorithm', 'database', 'network'],
  GS_DEFENCE_SCHEMES: ['army', 'navy', 'air force', 'defence', 'missile', 'satellite', 'isro', 'drdo', 'pradhan mantri'],
  ENG_ERROR_SPOTTING: ['error', 'grammatical error', 'spot the error', 'no error'],
  ENG_FILL_BLANKS: ['fill in', 'blank', 'suitable word', 'appropriate word'],
  ENG_SYNONYMS: ['synonym', 'similar in meaning', 'closest in meaning', 'same meaning'],
  ENG_ANTONYMS: ['antonym', 'opposite in meaning', 'opposite meaning'],
  ENG_SPELLING: ['correct spelling', 'correctly spelt', 'misspelt', 'misspelled'],
  ENG_IDIOMS_PHRASES: ['idiom', 'phrase', 'expression means', 'proverb'],
  ENG_ONE_WORD_SUB: ['one word', 'substitution', 'one-word'],
  ENG_SENTENCE_IMPROVEMENT: ['improve', 'improvement', 'bold part', 'underlined'],
  ENG_ACTIVE_PASSIVE: ['active', 'passive', 'voice', 'change the voice'],
  ENG_DIRECT_INDIRECT: ['direct', 'indirect', 'narration', 'reported speech'],
  ENG_SENTENCE_REARRANGEMENT: ['rearrange', 'jumbled', 'para jumble', 'sentence parts'],
  ENG_READING_COMPREHENSION: ['passage', 'read the passage', 'comprehension', 'according to the passage', 'author'],
  ENG_CLOZE_TEST: ['cloze', 'cloze test', 'numbered blanks']
};

// ── Figure/diagram keyword detection (Bug 2 fix) ───────────
// A question is image-based ONLY if its text has these phrases.
// Never flag based on empty options alone.
const IMAGE_KEYWORDS = [
  'select the figure',
  'figure that will replace',
  'figure that will come',
  'figure should replace',
  'figure series',
  'following figure series',
  'following series',
  'mirror image',
  'water image',
  'embedded in the given figure',
  'option figure which is embedded',
  'paper is folded',
  'paper folding',
  'paper fold',
  'punch hole',
  'positions of the same dice',
  'positions of the dice',
  'replace the question mark',
  'replace ?',
  'complete the pattern',
  'complete the figure',
  'count the number of',
  'how many triangles',
  'how many squares',
  'answer figure',
  'problem figure',
  'question mark (?) in the following',
  'hidden figure',
  'find the pattern',
  'venn diagram',
];

function isImageQuestion(questionText) {
  const lower = questionText.toLowerCase();
  return IMAGE_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Ad / noise lines to skip ─────────────────────────────────
const AD_PATTERNS = [
  /adda\s*247/i,
  /testprime/i,
  /test\s+prime/i,
  /get it on/i,
  /google play/i,
  /70,000\+/i,
  /mock tests/i,
  /personalised report/i,
  /unlimited re-attempt/i,
  /exam covered/i,
  /previous year papers/i,
  /500%\s+refund/i,
  /attempt free mock/i,
  /nabard/i,
  /ibps/i,
  /applink\.adda247/i,
  /www\.adda247/i,
  /one subscription/i,
  /all exams/i,
  /refund on selection/i,
  /download the app/i,
  /free quizzes/i,
  /job alerts/i,
  /exammix\.com/i,
];

function isAdLine(line) {
  return AD_PATTERNS.some(p => p.test(line));
}

// ── Section patterns ────────────────────────────────────────
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

// Standard SSC CGL Tier-1 section order (used as fallback)
// The section ORDER can vary per paper, but question blocks are always 25 each.
// Default order: Reasoning → GS → Quant → English
const DEFAULT_SECTION_ORDER = ['REASONING', 'GS', 'QUANT', 'ENGLISH'];

// ── Pre-scan lines to build section map ─────────────────────
function preScanSections(lines) {
  // Build: [{lineIndex, section}] sorted by lineIndex
  const markers = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    for (const sh of SECTION_HEADERS) {
      if (sh.regex.test(line) && line.length < 100) {
        markers.push({ lineIndex: i, section: sh.section });
        break;
      }
    }
  }
  return markers;
}

// Given line index and section markers, find current section
function getSectionAtLine(lineIndex, markers) {
  let section = null;
  for (const m of markers) {
    if (m.lineIndex <= lineIndex) section = m.section;
    else break;
  }
  return section;
}

// Assign section by question number (25 questions per section)
// Detects actual section order from markers if available
function assignSectionByQNum(qNum, markers) {
  // Build section order from markers
  const order = [];
  const seen = new Set();
  for (const m of markers) {
    if (!seen.has(m.section)) {
      order.push(m.section);
      seen.add(m.section);
    }
  }
  // Use detected order, or fall back to default
  const sectionOrder = order.length === 4 ? order : DEFAULT_SECTION_ORDER;

  if (qNum >= 1 && qNum <= 25) return sectionOrder[0];
  if (qNum >= 26 && qNum <= 50) return sectionOrder[1];
  if (qNum >= 51 && qNum <= 75) return sectionOrder[2];
  if (qNum >= 76 && qNum <= 100) return sectionOrder[3];
  return null;
}

// Infer section from topic tag
function inferSectionFromTopic(topic) {
  if (!topic) return null;
  if (topic.startsWith('QUANT_')) return 'QUANT';
  if (topic.startsWith('REASON_')) return 'REASONING';
  if (topic.startsWith('GS_')) return 'GS';
  if (topic.startsWith('ENG_')) return 'ENGLISH';
  return null;
}

// ── Year & Shift extraction ─────────────────────────────────
function extractMeta(filename) {
  let year = null, shift = null;
  const ym = filename.match(/20(1[89]|2[0-5])/);
  if (ym) year = parseInt('20' + ym[1]);

  // Dec papers without year in filename (e.g., "1-Dec-11.45PM-EN.pdf") → 2024
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

// ── Extract text lines from PDF ─────────────────────────────
async function extractLines(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const lineObjects = [];
  const checkmarkYs = [];

  for (let p = 1; p <= doc.numPages; p++) {
    try {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      const opList = await page.getOperatorList();

      // Extract checkmark Ys
      let lastTransform = null;
      for (let i = 0; i < opList.fnArray.length; i++) {
        if (opList.fnArray[i] === pdfjsLib.OPS.transform) lastTransform = opList.argsArray[i];
        if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
          const w = opList.argsArray[i][1];
          const h = opList.argsArray[i][2];
          if (lastTransform && w === h && w >= 14 && w <= 24) {
            checkmarkYs.push(lastTransform[5]);
          }
        }
      }

      let lastY = null, buf = [];
      for (const item of tc.items) {
        if (!item.str) continue;
        const text = item.str;
        if (!text.trim()) continue;
        const y = item.transform ? Math.round(item.transform[5]) : 0;

        if (lastY !== null && Math.abs(y - lastY) > 4) {
          const joined = buf.join(' ');
          if (joined && !isAdLine(joined)) lineObjects.push({ str: joined, y: lastY });
          buf = [text];
        } else {
          buf.push(text);
        }
        lastY = y;
      }
      if (buf.length) {
        const joined = buf.join(' ');
        if (joined && !isAdLine(joined)) lineObjects.push({ str: joined, y: lastY });
      }
    } catch (pageErr) {
      // Skip bad page — don't abort entire PDF
      console.warn(`    ⚠ Page ${p} error: ${pageErr.message}`);
    }
  }
  return { lineObjects, checkmarkYs };
}

// ── Detect PDF format ───────────────────────────────────────
function detectFormat(lines) {
  const text = lines.join('\n');

  // Format A: "Chosen Option" present → 2024 official response sheets
  if (/Chosen Option/i.test(text)) return 'A';

  // Format B: "Ans." or "Ans:" with (a)/(b)/(c)/(d) → 2025 papers
  if (/Ans[\.\s]*\([a-d]\)/i.test(text)) return 'B';

  // Format C: Explanation section with "1. ( a )" pattern → Yearwise books
  if (/\d+\.\s*\(\s*[a-d]\s*\)\s+\w/i.test(text) && /Yearwise|Solved Paper/i.test(text)) return 'C';

  // Format D: Traditional Q-A with answer key at end
  if (/answer\s*key/i.test(text)) return 'D';

  // Format C fallback: has ( a ) ( b ) ( c ) ( d ) options and explanation section
  if (/\(\s*[a-d]\s*\)/i.test(text)) return 'C';

  return 'D'; // default
}

// ══════════════════════════════════════════════════════════════
// FORMAT A: 2024 Official Response Sheets
// ══════════════════════════════════════════════════════════════
function parseFormatA(lines, filename, year, shift) {
  const questions = [];
  const markers = preScanSections(lines);
  let currentSection = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect section from pre-scan or inline
    const scannedSection = getSectionAtLine(i, markers);
    if (scannedSection) currentSection = scannedSection;

    // Also check inline (for papers where header appears mid-line)
    for (const sh of SECTION_HEADERS) {
      if (sh.regex.test(line) && line.length < 100) { currentSection = sh.section; break; }
    }

    // Detect question: "Q.1 question text" or "Q.1" on its own line
    const qMatch = line.match(/^Q\.?\s*(\d+)\s+(.*)/i);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      const qLineIndex = i;
      let qText = qMatch[2].trim();

      // Collect question text until we hit "Ans" line
      i++;
      while (i < lines.length && !/^Ans\s/i.test(lines[i].trim())) {
        // Skip metadata lines
        if (/^(SubQuestion|Comprehension:|Combined Graduate|Roll Number|Candidate Name|Venue Name|Exam Date|Exam Time|Subject )/i.test(lines[i].trim())) {
          i++; continue;
        }
        qText += ' ' + lines[i].trim();
        i++;
      }

      // Parse options from "Ans 1. ... 2. ... 3. ... 4. ..."
      const options = { A: '', B: '', C: '', D: '' };
      if (i < lines.length && /^Ans\s/i.test(lines[i].trim())) {
        let ansLine = lines[i].trim().replace(/^Ans\s*/i, '');
        i++;
        // Options might span multiple lines
        while (i < lines.length && !/^Question ID|^Status|^Chosen|^Q\.\s*\d/i.test(lines[i].trim())) {
          ansLine += ' ' + lines[i].trim();
          i++;
        }

        // Parse "1. text 2. text 3. text 4. text"
        const optMatches = ansLine.match(/(\d)\.\s*(.*?)(?=\s+\d\.\s|$)/g);
        if (optMatches) {
          for (const m of optMatches) {
            const om = m.match(/(\d)\.\s*(.*)/);
            if (om) {
              const idx = parseInt(om[1]);
              if (idx >= 1 && idx <= 4) {
                options[['A', 'B', 'C', 'D'][idx - 1]] = om[2].trim();
              }
            }
          }
        }
      }

      // Find "Chosen Option" → this is the CORRECT answer
      let correctOpt = null;
      while (i < lines.length) {
        const cl = lines[i].trim();
        if (/^Chosen Option\s*:\s*(\d)/i.test(cl)) {
          const cm = cl.match(/Chosen Option\s*:\s*(\d)/i);
          if (cm) {
            const idx = parseInt(cm[1]);
            if (idx >= 1 && idx <= 4) correctOpt = ['A', 'B', 'C', 'D'][idx - 1];
          }
          i++;
          break;
        }
        if (/^Q\.\s*\d/i.test(cl) || /^Section/i.test(cl)) break;
        i++;
      }

      // Determine section: use current, or fallback to qNum mapping
      let qSection = currentSection || assignSectionByQNum(qNum, markers);

      if (qText.length > 5 && correctOpt) {
        questions.push({
          id: `${filename.replace(/\.pdf$/i, '')}-Q${String(qNum).padStart(3, '0')}`,
          _qNum: qNum,
          section: qSection,
          topic: null,
          year, shift,
          source_pdf: filename,
          question_text: qText.trim(),
          options,
          correct_option: correctOpt,
          explanation: null
        });
      }
      continue;
    }
    i++;
  }
  return questions;
}

// ══════════════════════════════════════════════════════════════
// FORMAT B: 2025 Similar Papers with Ans. (a)/(b)/(c)/(d)
// ══════════════════════════════════════════════════════════════
function parseFormatB(lines, filename, year, shift) {
  const questions = [];
  const markers = preScanSections(lines);
  let currentSection = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    const scannedSection = getSectionAtLine(i, markers);
    if (scannedSection) currentSection = scannedSection;
    for (const sh of SECTION_HEADERS) {
      if (sh.regex.test(line) && line.length < 100) { currentSection = sh.section; break; }
    }

    // Detect question: "Q1." or "Q 1." or "1."
    const qMatch = line.match(/^Q[\.\s]*(\d+)[\.\s:]\s*(.*)/i) || line.match(/^(\d+)\.\s+(.*)/);
    if (qMatch && parseInt(qMatch[1]) <= 200) {
      const qNum = parseInt(qMatch[1]);
      // Strip leading ". " from captured text (happens with "Q 1 . text" pattern)
      let qText = qMatch[2].trim().replace(/^\.\s*/, '');
      i++;

      // Collect until options or answer
      const options = { A: '', B: '', C: '', D: '' };
      let correctOpt = null;

      while (i < lines.length) {
        const cl = lines[i].trim();

        // Answer line: "Ans. (c)" or "Ans: (d)" or "Answer: (b)"
        const ansMatch = cl.match(/^Ans[\.\s:]*\(?([a-dA-D])\)?/i);
        if (ansMatch) {
          correctOpt = ansMatch[1].toUpperCase();
          i++;
          break;
        }

        // Options: "(a) text" or "(A) text"
        const optMatch = cl.match(/^\(([a-dA-D])\)\s*(.*)/);
        if (optMatch) {
          options[optMatch[1].toUpperCase()] = optMatch[2].trim();
          i++;
          continue;
        }

        // Next question
        if (/^Q[\.\s]*\d+[\.\s:]/i.test(cl) || /^(\d+)\.\s+/.test(cl)) break;

        // Part of question text
        qText += ' ' + cl;
        i++;
      }

      // Determine section
      let qSection = currentSection || assignSectionByQNum(qNum, markers);

      if (qText.length > 5 && correctOpt) {
        questions.push({
          id: `${filename.replace(/\.pdf$/i, '')}-Q${String(qNum).padStart(3, '0')}`,
          _qNum: qNum,
          section: qSection,
          topic: null,
          year, shift,
          source_pdf: filename,
          question_text: qText.trim(),
          options,
          correct_option: correctOpt,
          explanation: null
        });
      }
      continue;
    }
    i++;
  }
  return questions;
}

// ══════════════════════════════════════════════════════════════
// FORMAT C: Yearwise Book PDFs
// Options: ( a ) text ( b ) text ( c ) text ( d ) text
// Answer section: "41. ( d ) explanation..."
// NOTE: Answer section may NOT have a header like "Solutions"
// ══════════════════════════════════════════════════════════════
function parseFormatC(lines, filename, year, shift) {
  const questions = [];
  let currentSection = null;

  // First pass: find ALL answer lines: "N. ( x ) explanation"
  // These are answers/explanations, distinguished by having (a)/(b)/(c)/(d) right after N.
  const answerMap = {};

  for (const line of lines) {
    const m = line.match(/^(\d+)\.\s*\(\s*([a-dA-D])\s*\)\s*(.*)/);
    if (m) {
      const qNum = parseInt(m[1]);
      // Only treat as answer if it looks like an answer (not a question option)
      // Answer lines typically appear after all questions
      answerMap[qNum] = {
        correct: m[2].toUpperCase(),
        explanation: m[3].trim()
      };
    }
  }

  // If we found answers for most questions (>50), this is a valid Format C
  if (Object.keys(answerMap).length < 20) {
    return questions; // Not enough answers found, skip
  }

  // Build section headers (handle fragmented case like "G eneral I ntellIGence")
  const SECTION_C = [
    { regex: /intelligence.*reasoning|reasoning.*ability/i, section: 'REASONING' },
    { regex: /general\s*awareness|general\s*knowledge|general\s*studies/i, section: 'GS' },
    { regex: /quantitative\s*aptitude|mathematics/i, section: 'QUANT' },
    { regex: /english\s*comprehension|english\s*language/i, section: 'ENGLISH' },
  ];

  // Second pass: extract questions
  // Questions are lines matching "N. question text" where N <= 100
  // Skip lines that are answer lines (already captured above)
  let i = 0;
  const questionLines = [];

  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect section (normalize case for fragmented headers)
    const normalized = line.replace(/\s+/g, ' ').toLowerCase();
    for (const sh of SECTION_C) {
      if (sh.regex.test(normalized) && line.length < 100) {
        currentSection = sh.section;
        break;
      }
    }

    // Question: "N. text" where N is 1-100
    const qMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      if (qNum >= 1 && qNum <= 100) {
        // Check if this is an answer line (has ( a/b/c/d ) pattern after number)
        const isAnswer = /^\d+\.\s*\(\s*[a-dA-D]\s*\)/.test(line);
        if (!isAnswer) {
          let qText = qMatch[2].trim();
          const qStartLine = i;
          i++;

          const options = { A: '', B: '', C: '', D: '' };

          // Collect until next question or answer section
          while (i < lines.length) {
            const cl = lines[i].trim();

            // Next question?
            if (/^\d+\.\s+/.test(cl)) {
              const nextNum = parseInt(cl.match(/^(\d+)/)[1]);
              // It's a next question if the number is sequential or close
              if (nextNum >= 1 && nextNum <= 100 && !/^\d+\.\s*\(\s*[a-dA-D]\s*\)/.test(cl)) break;
              // It's an answer line
              if (/^\d+\.\s*\(\s*[a-dA-D]\s*\)/.test(cl)) break;
            }

            // Options: "( a ) text ( b ) text" on same line or separate lines
            const optMatches = [...cl.matchAll(/\(\s*([a-dA-D])\s*\)\s*([^(]*)/gi)];
            if (optMatches.length > 0) {
              for (const om of optMatches) {
                const letter = om[1].toUpperCase();
                const text = om[2].trim();
                if (text.length > 0) {
                  options[letter] = (options[letter] ? options[letter] + ' ' : '') + text;
                }
              }
            } else {
              qText += ' ' + cl;
            }
            i++;
          }

          const answer = answerMap[qNum];
          const qSection = currentSection || assignSectionByQNum(qNum, []);
          if (qText.length > 3 && answer) {
            questions.push({
              id: `${filename.replace(/\.pdf$/i, '')}-Q${String(qNum).padStart(3, '0')}`,
              _qNum: qNum,
              section: qSection,
              topic: null,
              year, shift,
              source_pdf: filename,
              question_text: qText.trim(),
              options,
              correct_option: answer.correct,
              explanation: answer.explanation || null
            });
          }
          continue;
        }
      }
    }
    i++;
  }
  return questions;
}

// ══════════════════════════════════════════════════════════════
// FORMAT D: Traditional papers with answer key at end
// ══════════════════════════════════════════════════════════════
function parseFormatD(lines, filename, year, shift) {
  const questions = [];
  let currentSection = null;

  // Extract answer key from end
  const answerKey = {};
  let inKey = false;
  for (const line of lines) {
    if (/answer\s*key|correct\s*answer/i.test(line.trim())) {
      inKey = true;
      continue;
    }
    if (inKey) {
      // "1. A" or "1-A" or "1.(A)" or "Q1 A"
      const matches = [...line.matchAll(/(\d+)\s*[\.\)\-:]\s*\(?([A-Da-d])\)?/g)];
      for (const m of matches) {
        answerKey[parseInt(m[1])] = m[2].toUpperCase();
      }
    }
  }

  // Parse questions
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    for (const sh of SECTION_HEADERS) {
      if (sh.regex.test(line)) { currentSection = sh.section; break; }
    }

    if (/answer\s*key|correct\s*answer/i.test(line)) break;

    // Question
    const qMatch = line.match(/^Q[\.\s]*(\d+)[\.\s:]\s*(.*)/i) || line.match(/^(\d+)[\.\)]\s+(.*)/);
    if (qMatch && parseInt(qMatch[1]) <= 200) {
      const qNum = parseInt(qMatch[1]);
      let qText = qMatch[2].trim();
      i++;

      const options = { A: '', B: '', C: '', D: '' };
      let lastOpt = null;

      while (i < lines.length) {
        const cl = lines[i].trim();

        if (/^Q[\.\s]*\d+/i.test(cl) || /^\d+[\.\)]\s/.test(cl)) break;
        if (/answer\s*key/i.test(cl)) break;

        // Options: "(A) text" or "A. text" or "A) text"
        const optM = cl.match(/^\(?([A-Da-d])\)?[\.\)\s]\s*(.*)/);
        if (optM) {
          const letter = optM[1].toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(letter)) {
            options[letter] = optM[2].trim();
            lastOpt = letter;
            i++;
            continue;
          }
        }

        if (lastOpt) {
          options[lastOpt] += ' ' + cl;
        } else {
          qText += ' ' + cl;
        }
        i++;
      }

      const correct = answerKey[qNum] || null;
      const qSection = currentSection || assignSectionByQNum(qNum, []);
      if (qText.length > 5) {
        questions.push({
          id: `${filename.replace(/\.pdf$/i, '')}-Q${String(qNum).padStart(3, '0')}`,
          _qNum: qNum,
          section: qSection,
          topic: null,
          year, shift,
          source_pdf: filename,
          question_text: qText.trim(),
          options,
          correct_option: correct,
          explanation: null
        });
      }
      continue;
    }
    i++;
  }
  return questions;
}

// ── Auto-tag topic ──────────────────────────────────────────
function autoTagTopic(text, section) {
  const lower = text.toLowerCase();
  let bestTopic = null, bestScore = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const topicPrefix = topic.split('_')[0];
    
    // Strict Section Enforcement
    if (section && section !== 'MISC') {
      const allowedPrefix = section === 'REASONING' ? 'REASON' : section === 'ENGLISH' ? 'ENG' : section;
      if (topicPrefix !== allowedPrefix) continue;
    }

    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length;
    }
    if (score > bestScore) { bestScore = score; bestTopic = topic; }
  }

  if (!bestTopic && section) {
    const defaults = { QUANT: 'QUANT_ALGEBRA', REASONING: 'REASON_ANALOGY', GS: 'GS_CURRENT_AFFAIRS', ENGLISH: 'ENG_FILL_BLANKS' };
    bestTopic = defaults[section] || null;
  }
  return bestTopic;
}

// ── Deduplication ───────────────────────────────────────────
function dedup(questions) {
  const seen = new Map();
  const duplicates = [];
  let dupCounter = 1;

  for (const q of questions) {
    const key = q.question_text.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim().substring(0, 80);
    if (!seen.has(key)) {
      seen.set(key, q);
    } else {
      const ex = seen.get(key);
      if (!ex.correct_option && q.correct_option) {
        duplicates.push(ex);
        seen.set(key, q);
      } else {
        if (!ex.explanation && q.explanation) ex.explanation = q.explanation;
        duplicates.push(q);
      }
    }
  }

  // Move duplicates to MISC section so they don't appear in Full Mock Tests
  // but are still accessible via Topic-wise Tests under MISC > Duplicate Questions.
  for (const dup of duplicates) {
    dup.section = 'MISC';
    dup.topic = 'MISC_DUPLICATE';
    dup.id = dup.id + '_DUP' + dupCounter++;
  }

  return [...seen.values(), ...duplicates];
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  console.log('═══════════════════════════════════════════════');
  console.log('  SSC CGL PYQ Parser v2');
  console.log('═══════════════════════════════════════════════');
  console.log(`  PYQ Dir: ${PYQ_DIR}`);
  console.log(`  Output:  ${OUTPUT_FILE}\n`);

  if (!fs.existsSync(PYQ_DIR)) { console.error('PYQ dir not found!'); process.exit(1); }

  const files = fs.readdirSync(PYQ_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .filter(f => !/\(\d+\)\.pdf$/i.test(f)) // Skip duplicate copies like "(1).pdf"
    .sort();
  console.log(`  Found ${files.length} PDF files\n`);

  const allQuestions = [];
  const errors = [];
  const formatCounts = { A: 0, B: 0, C: 0, D: 0 };

  for (const file of files) {
    try {
      console.log(`  📄 ${file}`);
      const { year, shift } = extractMeta(file);
      const { lineObjects, checkmarkYs } = await extractLines(path.join(PYQ_DIR, file));
      const lines = lineObjects.map(l => l.str);
      const format = detectFormat(lines);
      formatCounts[format]++;

      let questions;
      switch (format) {
        case 'A': questions = await parseFormatAVector(path.join(PYQ_DIR, file), file, year, shift); break;
        case 'B': questions = parseFormatB(lines, file, year, shift); break;
        case 'C': questions = parseFormatC(lines, file, year, shift); break;
        case 'D': questions = parseFormatD(lines, file, year, shift); break;
        default: questions = parseFormatD(lines, file, year, shift);
      }

      // Auto-tag topics and fix missing sections
      for (const q of questions) {
        q.topic = autoTagTopic(q.question_text, q.section);

        // If section still null, try to infer from topic
        if (!q.section && q.topic) {
          q.section = inferSectionFromTopic(q.topic);
        }

        // Last resort: assign by question number
        if (!q.section && q._qNum) {
          q.section = assignSectionByQNum(q._qNum, []);
        }

        // ── CORE FIX: Rescue questions assigned to wrong sections ──
        // When section headers are absent, questions are position-assigned (Q1-25,
        // Q26-50, etc.) using the default order. If the paper's actual order differs,
        // questions land in wrong sections. We rescue using section-unique keywords
        // that CANNOT plausibly appear in other sections' question texts.
        (() => {
          const lower = q.question_text.toLowerCase();

          // ENGLISH rescue — English vocabulary is extremely distinctive
          const isEnglish = [
            'passive voice', 'active voice', 'direct speech', 'indirect speech',
            'narration', 'synonym of', 'antonym of', 'synonymous with',
            'one word substitution', 'one-word substitution',
            'correct spelling', 'misspelt', 'misspelled', 'correctly spelt',
            'error in the sentence', 'spot the error', 'no error',
            'fill in the blank', 'reading comprehension', 'cloze test',
            'rearrange the following', 'sentence improvement', 'phrasal verb',
            'most appropriate word to fill', 'grammatically correct sentence',
            'select the correct',  // only valid in English grammar context
          ].some(kw => lower.includes(kw));

          // REASONING rescue — uniquely identifiable Reasoning question types
          const isReasoning = [
            ' is to ', ' :: ', 'is related to', 'find the odd', 'odd one out',
            'odd man out', 'select the odd', 'which does not belong',
            'is coded as', 'coded as', 'in a certain code',
            'is the son of', 'is the daughter of', 'is the father of',
            'is the mother of', 'is the brother of', 'is the sister of',
            'blood relation', 'pointing to',
            'facing north', 'facing south', 'facing east', 'facing west',
            'turned left', 'turned right', 'walks north', 'walks south',
            'mirror image', 'water image',
            'paper is folded', 'when the paper', 'punch hole',
            'how many triangles', 'how many squares', 'count the number of',
            'embedded figure', 'figure matrix', 'complete the pattern',
            'dice is', 'face of the cube', 'opposite face',
            'sitting in a row', 'seating arrangement', 'linear arrangement',
            'venn diagram best represent',
          ].some(kw => lower.includes(kw));

          // GS rescue — specific to General Awareness content
          const isGS = [
            'constitution of india', 'article of the constitution',
            'fundamental right', 'directive principle', 'rajya sabha', 'lok sabha',
            'the battle of', 'mughal', 'maurya', 'gupta dynasty',
            'mahatma gandhi', 'jawaharlal nehru', 'subhas chandra',
            'si unit of', 's.i. unit of', 'unit of measurement',
            'national park', 'wildlife sanctuary', 'biosphere reserve',
            'gst', 'goods and services tax', 'reserve bank of india',
            'which article', 'schedule of the constitution',
            'pradhan mantri', 'yojana', 'launched by the government',
            'who is the author of the book', 'written by',
          ].some(kw => lower.includes(kw));

          // Apply rescue — only override if wrongly assigned
          if (isEnglish && q.section !== 'ENGLISH') q.section = 'ENGLISH';
          else if (isReasoning && q.section !== 'REASONING') q.section = 'REASONING';
          else if (isGS && q.section !== 'GS') q.section = 'GS';
        })();


        // Clean up internal field
        delete q._qNum;


        // ── Bug 2 fix: keyword-based image detection ──
        const hasImage = isImageQuestion(q.question_text);
        q.has_image = hasImage;
        q.image_url = q.image_url || null;

        // ── Bug 3 fix: flag image-based options ──
        const opts = q.options || {};
        const filledOpts = ['A', 'B', 'C', 'D'].filter(l => (opts[l] || '').trim()).length;
        q.has_image_options = (hasImage && filledOpts < 2);

        // ── Bug 4 fix: underline detection ──
        q.has_underline = /underlined/i.test(q.question_text);
      }

      // Assign to MISC if there is no valid correct answer
      for (const q of questions) {
        if (!q.correct_option || !['A', 'B', 'C', 'D'].includes(q.correct_option)) {
          q.section = 'MISC';
        }
      }

      // Filter valid: require at least some question text
      const valid = questions.filter(q => q.question_text.length > 5);

      // Warn on low count but continue
      if (valid.length < 80) {
        console.warn(`     ⚠ LOW COUNT: Only ${valid.length} questions from ${file}`);
      }

      const withAnswer = valid.filter(q => q.section !== 'MISC').length;
      console.log(`     Format ${format} → ${valid.length} extracted (${withAnswer} with answers, ${valid.length - withAnswer} to MISC)`);
      allQuestions.push(...valid);
    } catch (err) {
      console.error(`  ✗ Error: ${file}: ${err.stack}`);
      errors.push({ file, error: err.message });
    }
  }

  const deduped = dedup(allQuestions);

  // Stats
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  Formats: A=${formatCounts.A} B=${formatCounts.B} C=${formatCounts.C} D=${formatCounts.D}`);
  console.log(`  Total extracted: ${allQuestions.length}`);
  console.log(`  After dedup: ${deduped.length}`);
  console.log(`  Errors: ${errors.length}`);

  const bySection = {};
  for (const q of deduped) bySection[q.section || 'UNKNOWN'] = (bySection[q.section || 'UNKNOWN'] || 0) + 1;
  console.log('\n  By section:');
  for (const [s, c] of Object.entries(bySection)) console.log(`    ${s}: ${c}`);

  const byYear = {};
  for (const q of deduped) byYear[q.year || '?'] = (byYear[q.year || '?'] || 0) + 1;
  console.log('\n  By year:');
  for (const [y, c] of Object.entries(byYear).sort()) console.log(`    ${y}: ${c}`);

  // Write
  const output = { version: '2.0', generated_at: new Date().toISOString(), total: deduped.length, parser_errors: errors, questions: deduped };
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n  ✓ Output: ${OUTPUT_FILE}`);
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
