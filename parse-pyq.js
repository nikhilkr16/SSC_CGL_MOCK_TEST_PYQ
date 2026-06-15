#!/usr/bin/env node
/* ============================================================
   SSC CGL PYQ PARSER  —  parse-pyq.js
   Run: node parse-pyq.js
   Output: mock-test-app/data/questions.json
   ============================================================

   BUGS FIXED vs original:
   1. Section mis-assignment  — questions were going to wrong sections
   2. False diagram flags     — text questions showed image placeholder
   3. Missing options         — old-format options (1-line, marked answers) were dropped
   4. Underline not visible   — questions with "underlined" now carry a flag + preserved text
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── pdfjs-dist (Node / legacy API) ──────────────────────────
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
// Silence the "fake worker" warning in Node
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

// ── Config ───────────────────────────────────────────────────
const PYQ_DIR  = path.join(__dirname, '..', 'PYQ');
const OUT_DIR  = path.join(__dirname, 'data');
const OUT_FILE = path.join(OUT_DIR, 'questions.json');

// ── Section header → internal key mapping ───────────────────
const SECTION_MAP = [
  { pattern: /quantitative/i,                          key: 'QUANT'     },
  { pattern: /arithmetic/i,                            key: 'QUANT'     },
  { pattern: /general intelligence|reasoning/i,        key: 'REASONING' },
  { pattern: /general awareness|general knowledge/i,   key: 'GS'        },
  { pattern: /english|language comprehension/i,        key: 'ENGLISH'   },
];

function mapSection(rawHeader) {
  for (const { pattern, key } of SECTION_MAP) {
    if (pattern.test(rawHeader)) return key;
  }
  return null; // unknown — will inherit current section
}

// SSC CGL section order (first section always comes first in PDF)
const SECTION_ORDER = ['REASONING', 'GS', 'QUANT', 'ENGLISH'];

// ── Figure/diagram keyword detection ────────────────────────
// A question is image-based ONLY if its text has these phrases.
// Never flag a question as image-based just because options are empty.
const IMAGE_KEYWORDS = [
  'select the figure',
  'figure that will replace',
  'figure that will come',
  'figure should replace',
  'figure series',
  'following figure series',
  'following series',          // for figure series questions
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
  /multilingual/i,
  /detailed solution/i,
  /all india rankings/i,
  /compete with lakhs/i,
  /editors.{0,5}choice/i,
  /rating/i,
  /installed/i,
  /education\s*•\s*education/i,
  /exammix\.com/i,
];

function isAdLine(line) {
  return AD_PATTERNS.some(p => p.test(line));
}

// ── Option line patterns ─────────────────────────────────────
// Matches: "1. text", "Ans 1. text", "X 1. text", "✔ 1. text", ".,, 1. text"
// Also: "1. " at start of line (old style)
const OPT_NUMBERED = /^(?:(?:ans|x|✔|✓|\"'|\.,,|'|√|\*)\s*)?([1-4])[.)]\s*(.*)/i;

// Letters A-D (some newer PDFs use A/B/C/D)
const OPT_LETTERED = /^(?:(?:ans|x|✔|✓|\"'|\.,,|'|√|\*)\s*)?([A-D])[.)]\s*(.*)/i;

// Correct answer marker lines: "✓ 1.", "\"' 2.", "Ans  3.", standalone
const CORRECT_MARKER = /^(?:✔|✓|\"'|'|√)\s*([1-4A-D])[.)]/;

// Question start: "Q.1 ", "Q 1. ", "Q1 "
const Q_START = /^Q[.\s]*(\d+)[.):\s]+(.+)/i;

// Section header
const SECTION_HEADER = /^section\s*[:\-]\s*(.+)/i;

// Status lines (from student answer key — skip from option parsing)
const STATUS_LINE = /^(status|question id|chosen option|question status)\s*[:\-]/i;

// ── Topic assignment (matches app.js TOPIC_MAP keywords) ────
const TOPIC_RULES = [
  // QUANT
  { section: 'QUANT', topic: 'QUANT_NUMBER_SYSTEM',      kws: ['lcm','hcf','divisib','remainder','prime','digit','integer'] },
  { section: 'QUANT', topic: 'QUANT_PERCENTAGE',         kws: ['percent','%','percentage'] },
  { section: 'QUANT', topic: 'QUANT_RATIO_PROPORTION',   kws: ['ratio','proportion','variation'] },
  { section: 'QUANT', topic: 'QUANT_AVERAGE',            kws: ['average','mean','weighted'] },
  { section: 'QUANT', topic: 'QUANT_INTEREST',           kws: ['simple interest','compound interest','rate of interest','principal','per cent per annum'] },
  { section: 'QUANT', topic: 'QUANT_PROFIT_LOSS',        kws: ['profit','loss','selling price','cost price','discount','marked price'] },
  { section: 'QUANT', topic: 'QUANT_MIXTURE_ALLEGATION', kws: ['mixture','alligation','concentration'] },
  { section: 'QUANT', topic: 'QUANT_TIME_DISTANCE',      kws: ['speed','distance','train','boat','upstream','downstream','km/h','relative speed'] },
  { section: 'QUANT', topic: 'QUANT_TIME_WORK',          kws: ['work','pipe','cistern','fill','empty','efficiency'] },
  { section: 'QUANT', topic: 'QUANT_ALGEBRA',            kws: ['algebra','polynomial','identity','x²','x³','quadratic','simplify','value of','expression','surd'] },
  { section: 'QUANT', topic: 'QUANT_GEOMETRY',           kws: ['triangle','circle','angle','tangent','chord','diameter','radius','parallel','congruent','centroid','orthocentre','incentre','circumcentre','median'] },
  { section: 'QUANT', topic: 'QUANT_MENSURATION',        kws: ['area','volume','surface area','perimeter','circumference','cube','cuboid','cylinder','cone','sphere','hemisphere','pyramid'] },
  { section: 'QUANT', topic: 'QUANT_TRIGONOMETRY',       kws: ['sin','cos','tan','cosec','sec','cot','trigonometr','elevation','depression'] },
  { section: 'QUANT', topic: 'QUANT_STATISTICS',         kws: ['mean','median','mode','bar graph','pie chart','histogram','frequency','standard deviation'] },
  { section: 'QUANT', topic: 'QUANT_SQUARE_ROOT',        kws: ['square root','cube root','√','³√','perfect square'] },
  // REASONING
  { section: 'REASONING', topic: 'REASON_ANALOGY',            kws: ['is related to','::','analogy','same way','related pair'] },
  { section: 'REASONING', topic: 'REASON_CLASSIFICATION',     kws: ['odd one','does not belong','different from','odd man'] },
  { section: 'REASONING', topic: 'REASON_SERIES',             kws: ['next term','next number','series','sequence','missing number','what comes next','wrong number'] },
  { section: 'REASONING', topic: 'REASON_CODING_DECODING',    kws: ['coded as','code language','coding','decoding','certain code'] },
  { section: 'REASONING', topic: 'REASON_BLOOD_RELATION',     kws: ['brother','sister','father','mother','son','daughter','uncle','aunt','nephew','niece','blood relation'] },
  { section: 'REASONING', topic: 'REASON_DIRECTION_DISTANCE', kws: ['north','south','east','west','direction','left turn','right turn','facing','walked'] },
  { section: 'REASONING', topic: 'REASON_SYLLOGISM',          kws: ['statement','conclusion','assumption','all','some','syllogism'] },
  { section: 'REASONING', topic: 'REASON_VENN_DIAGRAM',       kws: ['venn','best represent the relation'] },
  { section: 'REASONING', topic: 'REASON_PAPER_FOLDING',      kws: ['paper','fold','punch','cut','unfold'] },
  { section: 'REASONING', topic: 'REASON_MIRROR_WATER',       kws: ['mirror','water image','reflection','mirror image'] },
  { section: 'REASONING', topic: 'REASON_EMBEDDED_FIGURE',    kws: ['embedded','hidden figure'] },
  { section: 'REASONING', topic: 'REASON_PATTERN_COMPLETION', kws: ['pattern','replace the question mark','figure matrix'] },
  { section: 'REASONING', topic: 'REASON_MATHEMATICAL_OPS',   kws: ['interchange','replace sign','mathematical operation','equation correct','equation balanced'] },
  { section: 'REASONING', topic: 'REASON_DICE_CUBE',          kws: ['dice','opposite face','cube'] },
  { section: 'REASONING', topic: 'REASON_FIGURE_COUNTING',    kws: ['how many triangles','how many squares','count the'] },
  { section: 'REASONING', topic: 'REASON_RANKING_ARRANGEMENT',kws: ['rank','position','row','top','bottom','seating','arrangement'] },
  // GS
  { section: 'GS', topic: 'GS_HISTORY',          kws: ['battle','dynasty','mughal','maurya','gupta','empire','king','ruler','revolt','independence','freedom fighter','gandhi','nehru','british','colonial','vedic','harappa','indus'] },
  { section: 'GS', topic: 'GS_POLITY',           kws: ['constitution','article','amendment','fundamental','parliament','lok sabha','rajya sabha','president','governor','supreme court','high court','election','right','directive'] },
  { section: 'GS', topic: 'GS_GEOGRAPHY',        kws: ['river','mountain','plateau','plain','ocean','continent','latitude','longitude','climate','monsoon','earthquake','soil','mineral','forest','capital','lake','peninsula'] },
  { section: 'GS', topic: 'GS_ECONOMY',          kws: ['gdp','inflation','budget','tax','fiscal','monetary','bank','rbi','reserve bank','niti','gst','revenue','economy','fdi','currency','rupee'] },
  { section: 'GS', topic: 'GS_SCIENCE_PHYSICS',  kws: ['force','motion','gravity','newton','energy','electric','current','resistance','voltage','magnet','wave','sound','light','lens','pressure','momentum'] },
  { section: 'GS', topic: 'GS_SCIENCE_CHEMISTRY',kws: ['element','compound','acid','base','salt','ph','periodic','metal','non-metal','chemical','reaction','oxidation','carbon','oxygen','hydrogen','alloy','corrosion','polymer'] },
  { section: 'GS', topic: 'GS_SCIENCE_BIOLOGY',  kws: ['cell','blood','heart','liver','kidney','brain','bone','muscle','vitamin','protein','enzyme','dna','gene','chromosome','disease','virus','bacteria','plant','photosynthesis','respiration','digestion'] },
  { section: 'GS', topic: 'GS_ENVIRONMENT',      kws: ['environment','ecology','ecosystem','biodiversity','pollution','greenhouse','ozone','global warming','wildlife','national park','sanctuary','renewable','solar'] },
  { section: 'GS', topic: 'GS_CURRENT_AFFAIRS',  kws: ['award','prize','tournament','champion','medal','summit','conference','launched','minister','appointed','inaugurat','scheme','mission','yojana'] },
  { section: 'GS', topic: 'GS_CULTURE_ART',      kws: ['dance','music','painting','festival','temple','folk','classical','raga','instrument','heritage','unesco','sculpture','architecture','tribe'] },
  { section: 'GS', topic: 'GS_COMPUTER_IT',      kws: ['computer','software','hardware','internet','website','ram','rom','cpu','binary','programming','database','network','byte','keyboard'] },
  { section: 'GS', topic: 'GS_DEFENCE_SCHEMES',  kws: ['army','navy','air force','defence','missile','satellite','isro','drdo','exercise','border','operation','yojana','pradhan mantri'] },
  // ENGLISH
  { section: 'ENGLISH', topic: 'ENG_ERROR_SPOTTING',        kws: ['error','grammatical error','spot the error','incorrect part','no error'] },
  { section: 'ENGLISH', topic: 'ENG_FILL_BLANKS',           kws: ['fill in','blank','suitable word','appropriate word'] },
  { section: 'ENGLISH', topic: 'ENG_SYNONYMS',              kws: ['synonym','similar in meaning','closest in meaning','same meaning'] },
  { section: 'ENGLISH', topic: 'ENG_ANTONYMS',              kws: ['antonym','opposite in meaning','opposite meaning','contrary'] },
  { section: 'ENGLISH', topic: 'ENG_SPELLING',              kws: ['correct spelling','correctly spelt','misspelt','misspelled','incorrect spelling'] },
  { section: 'ENGLISH', topic: 'ENG_IDIOMS_PHRASES',        kws: ['idiom','phrase','meaning of','proverb','expression means'] },
  { section: 'ENGLISH', topic: 'ENG_ONE_WORD_SUB',          kws: ['one word','substitution','single word'] },
  { section: 'ENGLISH', topic: 'ENG_SENTENCE_IMPROVEMENT',  kws: ['improve','improvement','bold part','underlined','replace','better version'] },
  { section: 'ENGLISH', topic: 'ENG_ACTIVE_PASSIVE',        kws: ['active','passive','voice','convert','change the voice'] },
  { section: 'ENGLISH', topic: 'ENG_DIRECT_INDIRECT',       kws: ['direct','indirect','narration','reported speech','change the narration'] },
  { section: 'ENGLISH', topic: 'ENG_SENTENCE_REARRANGEMENT',kws: ['rearrange','jumbled','sequence','para jumble','order','sentence parts'] },
  { section: 'ENGLISH', topic: 'ENG_READING_COMPREHENSION', kws: ['passage','read the passage','comprehension','according to the passage','author'] },
  { section: 'ENGLISH', topic: 'ENG_CLOZE_TEST',            kws: ['cloze','cloze test','numbered blanks'] },
];

function assignTopic(section, text) {
  const lower = text.toLowerCase();
  for (const rule of TOPIC_RULES) {
    if (rule.section !== section) continue;
    if (rule.kws.some(kw => lower.includes(kw))) return rule.topic;
  }
  // Fallback: first topic of this section or MISC
  return 'MISC_UNANSWERED';
}

// ── Extract year / shift from filename ───────────────────────
function extractMeta(filename) {
  const base = path.basename(filename, '.pdf');

  // Pattern: SSC-CGL-Tier-1-Question-Paper_17.07.2023_11.45-AM-12.45-PM
  let m = base.match(/(\d{2})[.\-](\d{2})[.\-](\d{4})/);
  if (m) {
    const year = m[3];
    const day  = m[1];
    const mon  = m[2];
    const shiftHint = base.toLowerCase();
    const shift =
      (shiftHint.includes('9.00') || shiftHint.includes('9-00') || shiftHint.includes('11.45') || shiftHint.includes('shift-1') || shiftHint.includes('shift_1') || shiftHint.includes('s1'))  ? 'Shift 1' :
      (shiftHint.includes('2.30') || shiftHint.includes('12.00') || shiftHint.includes('shift-2') || shiftHint.includes('s2')) ? 'Shift 2' :
      (shiftHint.includes('4.00') || shiftHint.includes('5.15') || shiftHint.includes('shift-3') || shiftHint.includes('s3')) ? 'Shift 3' : 'Shift 1';
    return { year, date: `${day}/${mon}/${year}`, shift };
  }

  // Pattern: SSC-CGL-QUESTION-PAPER-17-Aug-2021-Shift-1
  m = base.match(/(\d{2})[- ](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[- ](\d{4})[- ]Shift[- ]?(\d)/i);
  if (m) {
    return { year: m[3], date: `${m[1]}-${m[2]}-${m[3]}`, shift: `Shift ${m[4]}` };
  }

  // Pattern: 1-Dec, 2-Dec, etc. (short names)
  m = base.match(/^(\d{1,2})[- ](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
  if (m) {
    const yearMatch = base.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : '2024';
    return { year, date: `${m[1]}-${m[2]}-${year}`, shift: 'Shift 1' };
  }

  const yearMatch = base.match(/\b(20\d{2})\b/);
  return { year: yearMatch ? yearMatch[1] : '?', date: base.slice(0, 20), shift: '?' };
}

// ── Clean raw text line ──────────────────────────────────────
function cleanLine(line) {
  return line
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\u0900-\u097F]/g, ' ') // keep ASCII + Devanagari
    .trim();
}

// ── Parse a single PDF ───────────────────────────────────────
async function parsePDF(filePath) {
  const meta    = extractMeta(filePath);
  const fileKey = path.basename(filePath, '.pdf');
  const questions = [];

  // Load PDF
  const data = new Uint8Array(fs.readFileSync(filePath));
  let doc;
  try {
    doc = await pdfjsLib.getDocument({ data, verbosity: 0 }).promise;
  } catch (err) {
    console.warn(`  ⚠ Could not load PDF: ${path.basename(filePath)} — ${err.message}`);
    return [];
  }

  // Collect all text lines from all pages
  const allLines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    try {
      const page    = await doc.getPage(p);
      const content = await page.getTextContent();
      let lineText  = '';
      let lastY     = null;

      for (const item of content.items) {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 3) {
          // New line
          const cleaned = cleanLine(lineText);
          if (cleaned) allLines.push(cleaned);
          lineText = '';
        }
        lineText += item.str;
        lastY = y;
      }
      if (lineText.trim()) allLines.push(cleanLine(lineText));
    } catch (pageErr) {
      // Skip bad page — don't abort entire PDF
      console.warn(`    ⚠ Page ${p} error: ${pageErr.message}`);
    }
  }

  // ── State machine ────────────────────────────────────────
  // SSC CGL: REASONING → GS → QUANT → ENGLISH (typical order)
  let currentSection   = SECTION_ORDER[0]; // default to first section
  let sectionConfirmed = false;

  let inQuestion       = false;
  let qNumber          = 0;
  let qText            = '';
  let rawOptions       = { 1: '', 2: '', 3: '', 4: '' };
  let correctNum       = null;  // 1-4
  let lastOptNum       = 0;
  let collectingOpts   = false;

  function pushQuestion() {
    if (!inQuestion || !qText.trim()) return;

    // ── Bug Fix 3: Option parsing with multiple fallbacks ────
    let opts = { A: '', B: '', C: '', D: '' };
    const letters = ['A', 'B', 'C', 'D'];

    // Primary: use collected rawOptions (numbered 1-4)
    if (rawOptions[1] || rawOptions[2] || rawOptions[3] || rawOptions[4]) {
      opts.A = rawOptions[1] || '';
      opts.B = rawOptions[2] || '';
      opts.C = rawOptions[3] || '';
      opts.D = rawOptions[4] || '';
    }

    // Count how many options have text
    const filledOpts = letters.filter(l => opts[l].trim()).length;

    // ── Bug Fix 2: Diagram detection by keyword, not by empty options ──
    const hasImage = isImageQuestion(qText);

    // Flag for image-based options (not just missing text — must be image question)
    const hasImageOptions = hasImage && filledOpts < 2;

    // ── Bug Fix 4: Underline detection ──────────────────────
    const hasUnderline = /underlined/i.test(qText);

    // ── Bug Fix 1: Section is already correctly tracked ──────
    // (section tracking happens below in the main loop)

    // Correct answer mapping: number 1-4 → letter A-D
    let correctOption = null;
    if (correctNum) {
      correctOption = letters[correctNum - 1] || null;
    }

    // Only add if question text is non-trivial
    if (qText.trim().length < 5) {
      resetQ();
      return;
    }

    const id = `${fileKey}-${currentSection}-Q${qNumber}`;

    questions.push({
      id,
      number:           qNumber,
      section:          currentSection,           // BUG 1 FIX: always from section tracker
      topic:            assignTopic(currentSection, qText),
      question_text:    qText.trim(),
      options:          opts,
      correct_option:   correctOption,
      has_image:        hasImage,                 // BUG 2 FIX: keyword-based only
      has_image_options:hasImageOptions,          // BUG 3 FIX: only when actually image options
      has_underline:    hasUnderline,             // BUG 4 FIX: new flag
      image_url:        null,                     // screenshots added separately
      source_pdf:       path.basename(filePath),
      year:             meta.year,
      date:             meta.date,
      shift:            meta.shift,
      explanation:      null,
    });

    resetQ();
  }

  function resetQ() {
    inQuestion     = false;
    qNumber        = 0;
    qText          = '';
    rawOptions     = { 1: '', 2: '', 3: '', 4: '' };
    correctNum     = null;
    lastOptNum     = 0;
    collectingOpts = false;
  }

  // ── Main line-by-line pass ───────────────────────────────
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    // Skip ad/noise lines
    if (isAdLine(line)) continue;

    // Skip metadata lines
    if (STATUS_LINE.test(line)) continue;
    if (/^(roll number|candidate name|venue name|exam date|exam time|subject)\s*[:\-]/i.test(line)) continue;
    if (/^(test date|test time|test venue|registration no)/i.test(line)) continue;

    // ── BUG 1 FIX: Section header detection ─────────────────
    const secMatch = line.match(SECTION_HEADER);
    if (secMatch) {
      const mapped = mapSection(secMatch[1]);
      if (mapped) {
        // Push any in-progress question before switching section
        pushQuestion();
        currentSection   = mapped;
        sectionConfirmed = true;
      }
      continue;
    }

    // ── Question start ───────────────────────────────────────
    const qMatch = line.match(Q_START);
    if (qMatch) {
      // Push previous question
      pushQuestion();

      inQuestion     = true;
      qNumber        = parseInt(qMatch[1], 10);
      qText          = qMatch[2] || '';
      rawOptions     = { 1: '', 2: '', 3: '', 4: '' };
      correctNum     = null;
      lastOptNum     = 0;
      collectingOpts = false;

      // Infer section from question number if not yet confirmed by header
      // (Some PDFs don't have section headers for first section)
      if (!sectionConfirmed && qNumber === 1) {
        currentSection = SECTION_ORDER[0]; // REASONING
      }
      continue;
    }

    if (!inQuestion) continue;

    // ── "Ans" standalone line — starts option block ──────────
    if (/^ans\.?$/i.test(line)) {
      collectingOpts = true;
      continue;
    }

    // ── Correct answer marker (standalone ✓ / ✔ / "' before option) ──
    const correctM = line.match(CORRECT_MARKER);
    if (correctM && !rawOptions[1]) {
      // e.g. "✓ 3." before options are parsed — mark as correct
      const val = correctM[1];
      if (!isNaN(val)) correctNum = parseInt(val, 10);
      else correctNum = ['A','B','C','D'].indexOf(val.toUpperCase()) + 1 || null;
    }

    // ── BUG 3 FIX: Option parsing with multiple format support ──
    // Try numbered option: "1. text" or "Ans 2. text" or "X 3. text"
    const optM = line.match(OPT_NUMBERED);
    if (optM || (collectingOpts && line.match(OPT_LETTERED))) {
      let optNum, optText;
      if (optM) {
        optNum  = parseInt(optM[1], 10);
        optText = optM[2].trim();

        // Strip answer markers from text itself
        optText = optText.replace(/^(x|✔|✓|\"'|\.,,|'|√|\*)\s+/i, '').trim();

        // Detect correct answer from marker before the option
        const prefixMarker = line.match(/^(✔|✓|\"'|'|√)\s+[1-4]/);
        if (prefixMarker && optNum) {
          correctNum = optNum;
          optText = optText; // already cleaned
        }
      } else {
        // Lettered option fallback
        const lm = line.match(OPT_LETTERED);
        optNum  = ['A','B','C','D'].indexOf(lm[1].toUpperCase()) + 1;
        optText = lm[2].trim().replace(/^(x|✔|✓|\"'|\.,,|'|√|\*)\s+/i, '').trim();
      }

      if (optNum >= 1 && optNum <= 4) {
        rawOptions[optNum] = (rawOptions[optNum] ? rawOptions[optNum] + ' ' : '') + optText;
        lastOptNum = optNum;
        collectingOpts = true;
      }
      continue;
    }

    // ── BUG 3 FIX: Continuation of option text (no new option number) ──
    if (collectingOpts && lastOptNum > 0) {
      // Only append if this doesn't look like a new question or section
      if (!Q_START.test(line) && !SECTION_HEADER.test(line) && !isAdLine(line)) {
        // Heuristic: if line looks like option text (short, no Q. prefix), append
        if (line.length < 200 && !line.match(/^Q\.\s*\d+/i)) {
          rawOptions[lastOptNum] += ' ' + line;
          rawOptions[lastOptNum] = rawOptions[lastOptNum].trim();
        }
      }
      continue;
    }

    // ── Append to question text (if not in option collection mode) ──
    if (!collectingOpts && qText && line.length < 300) {
      qText += ' ' + line;
    }
  }

  // Push last question
  pushQuestion();

  // ── Quality check ────────────────────────────────────────
  const count = questions.length;
  if (count < 80) {
    console.warn(`  ⚠ LOW COUNT: Only ${count} questions parsed from ${path.basename(filePath)}`);
  }

  return questions;
}

// ── Main entry ───────────────────────────────────────────────
async function main() {
  console.log('SSC CGL PYQ Parser — starting...\n');

  if (!fs.existsSync(PYQ_DIR)) {
    console.error(`ERROR: PYQ directory not found at ${PYQ_DIR}`);
    console.error('Expected: ../PYQ/  (one level up from mock-test-app/)');
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(PYQ_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort();

  if (files.length === 0) {
    console.error('No PDF files found in PYQ directory!');
    process.exit(1);
  }

  console.log(`Found ${files.length} PDFs in PYQ/\n`);

  const allQuestions = [];
  const seen = new Set();

  for (const file of files) {
    const filePath = path.join(PYQ_DIR, file);
    console.log(`Parsing: ${file}`);
    try {
      const qs = await parsePDF(filePath);

      // Deduplicate across PDFs by question text
      let added = 0;
      for (const q of qs) {
        const dedupeKey = q.question_text.slice(0, 80).toLowerCase().replace(/\s+/g, ' ');
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          allQuestions.push(q);
          added++;
        }
      }
      console.log(`  ✓ ${qs.length} parsed, ${added} unique added (total: ${allQuestions.length})`);
    } catch (err) {
      console.warn(`  ✗ Failed: ${err.message}`);
    }
  }

  // ── Section distribution report ──────────────────────────
  const dist = { QUANT: 0, REASONING: 0, GS: 0, ENGLISH: 0, MISC: 0 };
  for (const q of allQuestions) dist[q.section] = (dist[q.section] || 0) + 1;

  console.log('\n── Section Distribution ──');
  for (const [k, v] of Object.entries(dist)) {
    console.log(`  ${k.padEnd(12)}: ${v}`);
  }

  // Write output
  const output = { generated_at: new Date().toISOString(), total: allQuestions.length, questions: allQuestions };
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\n✓ Done! ${allQuestions.length} questions written to ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
