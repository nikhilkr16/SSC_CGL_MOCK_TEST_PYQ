# SSC CGL PYQ Mock Test Platform — Product Requirements Document

> **Version:** 1.0 · **Date:** 2026-06-11 · **Author:** Antigravity AI  
> **Stakeholder:** User (exam candidate, 2019-2025 PYQ collection)

---

## 1. Executive Summary

Build a **browser-based SSC CGL mock-test web application** that:
- Parses PYQ PDF papers stored in `e:\learn\SSC CGL\PYQ\` (84 PDFs, 2019–2025)
- Extracts questions, options, and correct answers **strictly from those PDFs** (✅ green highlighting = correct answer, end-of-PDF explanation pages = answer rationale)
- Offers two test modes: **Full Mock Test** and **Topic-wise Test**
- Enforces SSC CGL real-exam rules: section timers, section-lock, negative marking
- Produces a detailed **Test Report** after completion

---

## 2. Goals & Non-Goals

### Goals
| # | Goal |
|---|------|
| G1 | Extract questions, options, and correct answers 100% from the provided PYQ PDFs |
| G2 | Full Mock Test: 100 questions across 4 sections, 60-min total (15 min/section), section-selection before start |
| G3 | Topic-wise Test: 25 questions filtered by specific syllabus topic, 15-min timer |
| G4 | Zero tolerance for wrong answers — answers must exactly match the PDF-marked correct option |
| G5 | Post-test report: score, accuracy %, correct/wrong/unattempted counts with section-wise breakdown |
| G6 | Design follows DESIGN.md/SKILL.md tokens (dark blue theme, sans-serif, WCAG 2.2 AA) |

### Non-Goals
- No user authentication / login system (single-user local tool)
- No adaptive learning or AI-generated questions
- No Tier-2 coverage (Tier-1 only)
- No backend server; runs entirely in the browser (static HTML/JS/CSS)

---

## 3. PYQ Data Source

### 3.1 PDF Corpus
| Year Group | Files | Pattern |
|------------|-------|---------|
| 2019 | 6 PDFs | `SSC-CGL-QUESTION-PAPER-*-June-2019-*` |
| 2020 | 6 PDFs | `SSC-CGL-QUESTION-PAPER-*-March-2020-*` |
| 2021 | 4 PDFs | `SSC-CGL-QUESTION-PAPER-*-Aug-2021-*` |
| 2022 | 10 PDFs (Dec) | `*-Dec-*.pdf` |
| 2023 | 12 PDFs | `SSC-CGL-Tier-1-Question-Paper_*.2023_*` |
| 2024 | 12 PDFs | `SSC-CGL-Tier-1-Question-Paper_*.2024_*` |
| 2025 | 15 PDFs | `SSC-CGL-T-I-Similar-Paper-*-2025-*` |
| Yearwise books | 6 PDFs | `30 Yearwise SSC CGL Solved Paper (English) 20**.pdf` |

**Total: 84 PDF files**

### 3.2 Answer Extraction Rules — CRITICAL
> [!CAUTION]
> Answers MUST be derived from the PDFs only. No guessing, no external sources.

| Signal | Meaning | Extraction Method |
|--------|---------|-------------------|
| ✅ Green-highlighted option text | Correct answer for that question | Detect green background color on option text in PDF |
| Explanation section at end of PDF | Rationale/solution for answer | Parse "Explanation" / "Solution" block after all questions |
| Bold option in some PDFs | Sometimes used alongside green highlight | Secondary fallback signal |

**Parser Priority:**
1. Green-fill / green background color on option → correct answer
2. Answer key table (if present at end) → cross-reference option letter
3. Explanation text (confirms which option is correct)

### 3.3 Question Structure (per PDF)
Each question in the PDF has:
- `Q_ID`: Unique identifier (PDF_filename + question_number)
- `section`: One of `QUANT | REASONING | GS | ENGLISH`
- `question_text`: The question stem (may include image reference)
- `options`: `{A, B, C, D}` — text of each option
- `correct_option`: Letter of correct answer (`A|B|C|D`) from PDF
- `explanation`: Optional rationale text from end-of-PDF section
- `topic`: Syllabus topic tag (for Topic-wise filtering)
- `year`: Extracted from filename
- `shift`: Extracted from filename (S1/S2/S3)
- `source_pdf`: Filename of originating PDF

---

## 4. Syllabus Taxonomy (Topic Tags)

### Section 1 — Quantitative Aptitude (QUANT)
| Topic Tag | Sub-topics |
|-----------|-----------|
| `QUANT_NUMBER_SYSTEM` | Whole numbers, decimals, fractions, LCM/HCF |
| `QUANT_PERCENTAGE` | Percentage, percentage change |
| `QUANT_RATIO_PROPORTION` | Ratio, proportion, variation |
| `QUANT_AVERAGE` | Mean, weighted average |
| `QUANT_INTEREST` | Simple Interest, Compound Interest |
| `QUANT_PROFIT_LOSS` | Profit, loss, discount, marked price |
| `QUANT_MIXTURE_ALLEGATION` | Mixture, alligation rule |
| `QUANT_TIME_DISTANCE` | Speed-time-distance, trains, boats |
| `QUANT_TIME_WORK` | Time & Work, pipes & cisterns |
| `QUANT_ALGEBRA` | Identities, surds, linear equations, polynomials |
| `QUANT_GEOMETRY` | Triangles, circles, quadrilaterals, angles |
| `QUANT_MENSURATION` | 2D & 3D area/volume — circle, cylinder, cone, sphere |
| `QUANT_TRIGONOMETRY` | Ratios, identities, heights & distances |
| `QUANT_STATISTICS` | Mean/median/mode, histogram, bar chart, pie chart, data interpretation |
| `QUANT_SQUARE_ROOT` | Square roots, cube roots, surds |

### Section 2 — General Intelligence & Reasoning (REASONING)
| Topic Tag | Sub-topics |
|-----------|-----------|
| `REASON_ANALOGY` | Word analogy, number analogy, figure analogy |
| `REASON_CLASSIFICATION` | Odd one out — word/number/figure |
| `REASON_SERIES` | Number series, letter series, mixed series |
| `REASON_CODING_DECODING` | Letter coding, number coding |
| `REASON_BLOOD_RELATION` | Family tree, relations |
| `REASON_DIRECTION_DISTANCE` | Direction sense, distance |
| `REASON_RANKING_ARRANGEMENT` | Ranking, order, seating arrangement |
| `REASON_SYLLOGISM` | Statement-conclusion, statement-assumption |
| `REASON_VENN_DIAGRAM` | Set diagrams, Euler circles |
| `REASON_MATRIX` | Matrix-based questions |
| `REASON_FIGURE_COUNTING` | Counting triangles, squares in figures |
| `REASON_PAPER_FOLDING` | Paper folding, punching |
| `REASON_MIRROR_WATER` | Mirror/water image |
| `REASON_EMBEDDED_FIGURE` | Hidden/embedded figures |
| `REASON_PATTERN_COMPLETION` | Missing pattern in figure matrix |
| `REASON_MATHEMATICAL_OPS` | Arithmetic ops, sign change |
| `REASON_DICE_CUBE` | Dice, cube face identification |

### Section 3 — General Awareness (GS)
| Topic Tag | Sub-topics |
|-----------|-----------|
| `GS_HISTORY` | Ancient, Medieval, Modern Indian History |
| `GS_POLITY` | Indian Constitution, governance, amendments |
| `GS_GEOGRAPHY` | Physical, Indian, World Geography |
| `GS_ECONOMY` | Economic concepts, budget, banking, schemes |
| `GS_SCIENCE_PHYSICS` | Physics — motion, electricity, optics, sound |
| `GS_SCIENCE_CHEMISTRY` | Chemistry — elements, reactions, periodic table |
| `GS_SCIENCE_BIOLOGY` | Biology — human body, diseases, botany/zoology |
| `GS_ENVIRONMENT` | Ecology, environment, climate |
| `GS_CURRENT_AFFAIRS` | Events, appointments, sports, awards |
| `GS_CULTURE_ART` | Indian art, dance, music, festivals |
| `GS_COMPUTER_IT` | Basic computer, internet, abbreviations |
| `GS_DEFENCE_SCHEMES` | Military, government schemes, yojana |

### Section 4 — English Comprehension (ENGLISH)
| Topic Tag | Sub-topics |
|-----------|-----------|
| `ENG_ERROR_SPOTTING` | Spot the grammatical error |
| `ENG_FILL_BLANKS` | Fill in the blanks (vocabulary/grammar) |
| `ENG_SYNONYMS` | Synonyms |
| `ENG_ANTONYMS` | Antonyms |
| `ENG_SPELLING` | Correct spelling / misspelled words |
| `ENG_IDIOMS_PHRASES` | Idioms and phrases meaning |
| `ENG_ONE_WORD_SUB` | One-word substitution |
| `ENG_SENTENCE_IMPROVEMENT` | Improve the sentence |
| `ENG_ACTIVE_PASSIVE` | Active to passive voice (and vice-versa) |
| `ENG_DIRECT_INDIRECT` | Direct to indirect speech (and vice-versa) |
| `ENG_SENTENCE_REARRANGEMENT` | Para jumbles / shuffling of sentence parts |
| `ENG_READING_COMPREHENSION` | Reading comprehension passages |
| `ENG_CLOZE_TEST` | Cloze passage / paragraph fill |

---

## 5. Feature Specifications

### 5.1 Home Screen

**Layout:**
- Header: "SSC CGL Practice" logo + last-test-score badge
- Two large CTA cards:
  1. **Full Mock Test** — "100 Questions · 60 Minutes · 4 Sections"
  2. **Topic-wise Test** — "25 Questions · 15 Minutes · Pick Your Topic"
- Statistics bar: Total tests taken, average accuracy, best score

---

### 5.2 Full Mock Test Mode

#### 5.2.1 Section Selection Screen
- Shown before test starts
- Displays four section cards: **Quantitative Aptitude**, **General Intelligence & Reasoning**, **General Awareness**, **English Comprehension**
- Each card shows: 25 Questions · 15 Minutes
- User taps a section card to begin that section **first**
- **Rule:** Once a section is selected and timer starts, the candidate **cannot switch** to another section mid-section
- Remaining sections become available only after the active section's 15-minute timer expires (auto-advance) or all 25 questions answered

> [!IMPORTANT]
> Section switching is LOCKED during active section timer. Clicking another section card while a section is active shows a "Section in progress. Please complete or wait for timer to expire." toast.

#### 5.2.2 Question Screen (Full Test)
- Left panel: **Section Tab Bar** — all 4 sections always visible; active = highlighted; locked sections = greyed-out lock icon
- Main area: Question text, 4 radio-button options (A/B/C/D)
- Right panel: **Question Palette** — 25 numbered buttons, color-coded:
  - ⬜ White = Not visited
  - 🟦 Blue = Answered
  - 🟥 Red = Marked for review
  - 🟨 Yellow = Visited but unanswered
- Bottom toolbar: `← Previous` | `Mark for Review` | `Save & Next →`
- Top bar: Section name + **Section Timer** (countdown MM:SS, turns red at <2 min)
- Total elapsed time shown separately (not blocking)

#### 5.2.3 Section Auto-Advance
- When section timer hits 00:00:
  1. All unanswered questions in that section are locked (treated as unattempted)
  2. Pop-up: "Section time expired. Choose your next section."
  3. Section Selection screen reappears showing only uncompleted sections
- After all 4 sections complete → auto-navigate to Result Screen

#### 5.2.4 Question Randomisation
- At test initialisation: select 25 questions **randomly** per section from the full PYQ database
- No duplicate questions in a single test session
- Question order within a section is also randomised
- Seed based on `Date.now()` — different test every time

---

### 5.3 Topic-wise Test Mode

#### 5.3.1 Topic Selection Screen
- Displays 4 section accordion panels (Quant / Reasoning / GS / English)
- Each panel expands to show topic cards (from Section 4 taxonomy)
- Each topic card shows:
  - Topic name
  - Available question count from PYQ
  - "Start Test" button
- User selects exactly one topic → 25 questions drawn randomly from that topic's pool

> [!NOTE]
> If a topic has fewer than 25 available questions in the PYQ database, the system shows all available questions and displays "X questions available for this topic."

#### 5.3.2 Question Screen (Topic-wise)
- Single-section layout (no section tabs)
- Timer: **15:00** countdown, turns red at <3 min
- Question palette: 25 numbered buttons (same color coding as Full Test)
- No section switching (single topic, single session)
- Auto-submit at timer expiry

---

### 5.4 Marking Scheme

| Action | Marks |
|--------|-------|
| Correct answer | **+2** |
| Wrong answer | **−0.5** |
| Unattempted | **0** |

> [!CAUTION]
> **No mercy for wrong answers.** Negative marking of −0.5 is applied per SSC CGL official rules. The answer checked against the PDF-extracted correct option is FINAL.

---

### 5.5 Test Report Screen

Shown immediately after test submission or timer expiry.

#### 5.5.1 Summary Card (Top)
| Metric | Display |
|--------|---------|
| Total Score | `XX / 200` (large, prominent) |
| Accuracy % | `(Correct / Attempted) × 100` |
| Time Taken | MM:SS per section |
| Rank Projection | Estimated percentile band (based on historical cutoffs) |

#### 5.5.2 Section-wise Breakdown Table
| Section | Questions | Attempted | Correct | Wrong | Unattempted | Score | Accuracy |
|---------|-----------|-----------|---------|-------|-------------|-------|----------|
| Quant | 25 | — | — | — | — | — | —% |
| Reasoning | 25 | — | — | — | — | — | —% |
| GS | 25 | — | — | — | — | — | —% |
| English | 25 | — | — | — | — | — | —% |
| **Total** | **100** | — | — | — | — | — | —% |

#### 5.5.3 Question Review
- Each answered question expandable: shows question text, user's answer (marked ✅ or ❌), correct answer, and explanation (if available from PDF)
- Filter by: All / Correct / Wrong / Unattempted / Marked-for-review
- "Reattempt Wrong Questions" CTA → creates new Topic-wise mini-test from only the wrong questions

#### 5.5.4 Visual Charts
- **Donut chart**: Correct / Wrong / Unattempted split
- **Section Accuracy Bar**: Horizontal bars per section
- **Time Distribution**: Time spent per section (pie chart)

---

## 6. Data Architecture

### 6.1 PDF Parsing Pipeline (Build Step)

> [!IMPORTANT]
> This is a **one-time offline build step**, not a runtime process. The PDFs are parsed using a Node.js script (`parse-pyq.js`) that generates a single `questions.json` database file. The web app loads only this JSON file.

```
PYQ/*.pdf
   │
   ▼ [parse-pyq.js — Node.js + pdf-parse / pdfjs-dist]
   │  1. Extract all text content per page
   │  2. Detect green-fill color on option text → mark as correct_option
   │  3. Parse answer key tables (if present)
   │  4. Parse explanation section (end-of-PDF pages)
   │  5. Tag each question with section + topic keyword matching
   │
   ▼
questions.json  (≈ 8,000–12,000 questions)
   │
   ▼ [Loaded by index.html at runtime]
   │
   ▼ Web App (HTML + Vanilla JS + CSS)
```

### 6.2 `questions.json` Schema
```json
{
  "version": "1.0",
  "generated_at": "2026-06-11T...",
  "total": 10000,
  "questions": [
    {
      "id": "SSC-CGL-2024-09-09-Q001",
      "section": "QUANT",
      "topic": "QUANT_PERCENTAGE",
      "year": 2024,
      "shift": "S1",
      "source_pdf": "SSC-CGL-Tier-1-Question-Paper-English_09.09.2024_12.30-PM-01.30-PM.pdf",
      "question_text": "If 30% of a number is 90, what is 50% of the same number?",
      "options": {
        "A": "100",
        "B": "150",
        "C": "120",
        "D": "180"
      },
      "correct_option": "B",
      "explanation": "Let the number be x. 30% of x = 90 → x = 300. 50% of 300 = 150."
    }
  ]
}
```

### 6.3 Local Storage (Browser)
| Key | Value | Purpose |
|-----|-------|---------|
| `ssc_test_history` | JSON array of past test results | History tab |
| `ssc_current_test` | Active test state snapshot | Auto-save/resume |
| `ssc_topic_progress` | Per-topic accuracy map | Home screen stats |

---

## 7. Screen Flow Diagram

```
Home Screen
    ├── [Full Mock Test] ──────→ Section Selection Screen
    │                                  │
    │                          Pick Section (1 of 4)
    │                                  │
    │                          Active Section Timer (15:00)
    │                          ┌──────────────────────────┐
    │                          │ Question Screen           │
    │                          │ Q1 → Q25                 │
    │                          │ Timer expires → auto-lock │
    │                          └──────────────────────────┘
    │                                  │ (× 4 sections)
    │                                  ▼
    │                          Test Report Screen
    │
    └── [Topic-wise Test] ─────→ Topic Selection Screen
                                       │
                                 Pick Topic → 25 Qs
                                       │
                                 Timer (15:00) + Questions
                                       │
                                 Test Report Screen
```

---

## 8. Design System

Based on `DESIGN.md` and `SKILL.md`.

### 8.1 Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `color.surface.muted` | `#000000` | Page background |
| `color.surface.base` | `#0000ff` | Primary surface / cards |
| `color.surface.raised` | `#2e66cc` | Elevated panels, navigation |
| `color.surface.strong` | `#126cbf` | Active states, selected items |
| `color.text.primary` | `#ffffff` | Primary text on dark backgrounds |
| `color.text.secondary` | `#333333` | Secondary text |
| `color.text.inverse` | `#ff0000` | Alert / timer warning color |

### 8.2 Typography Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `font.family.primary` | `sans-serif` | All text |
| `font.size.base` | `12px` | Body text |
| `font.size.lg` | `13px` | Question text |
| `font.size.2xl` | `16px` | Section headings |
| `font.size.3xl` | `18px` | Score, primary CTA labels |
| `font.weight.base` | `500` | Default weight |

### 8.3 Spacing & Radius Tokens
| Token | Value |
|-------|-------|
| `space.7` | `6px` |
| `space.8` | `7px` |
| `radius.sm` | `4px` |
| `radius.md` | `7px` |
| `motion.duration.instant` | `300ms` |

### 8.4 Key Component States
Every interactive component must define:
- `default` · `hover` · `focus-visible` · `active` · `disabled` · `loading` · `error`

### 8.5 Accessibility Requirements (WCAG 2.2 AA)
- All text must pass contrast ratio ≥ 4.5:1 (normal) / 3:1 (large text)
- Focus indicators must be visible (`:focus-visible` outline required)
- Keyboard navigation: Tab to all interactive elements, Enter/Space to activate
- Timer countdown announced via `aria-live="polite"` at 5-min and 2-min warnings
- Question options use `<fieldset>` + `<legend>` + `<input type="radio">` semantics
- Color alone must not convey meaning (palette status uses icon + color)

---

## 9. User Interface Components

### 9.1 Section Timer Component
- Large circular countdown ring (CSS animation)
- MM:SS display in center
- Ring color: `color.surface.raised` → transitions to `color.text.inverse` (#ff0000) at <2 min
- Pulsing animation at <1 min
- `aria-live="assertive"` warning at 00:02:00 and 00:01:00

### 9.2 Question Palette
- Grid of 25 numbered squares
- Color states:
  - Not visited: border only, no fill
  - Answered: `color.surface.strong` fill
  - Marked for review: amber fill
  - Visited/unanswered: light red fill
- Clicking a number jumps to that question

### 9.3 Option Radio Buttons
- Custom styled `<input type="radio">` — no browser default appearance
- Selected: filled circle + `color.surface.raised` background on option row
- Correct (post-review): green border + ✅ icon
- Wrong (post-review): red border + ❌ icon + show correct answer highlighted

### 9.4 Progress Bar (Full Test)
- Thin bar at top of screen
- Shows proportion of overall test completed (sections done / 4)
- Animates on section completion

---

## 10. Technical Stack

| Layer | Technology |
|-------|-----------|
| Structure | Vanilla HTML5 |
| Styling | Vanilla CSS (custom properties from design tokens) |
| Logic | Vanilla JavaScript (ES2022, no framework) |
| PDF Parsing | Node.js build script using `pdfjs-dist` (Mozilla PDF.js) |
| Data | `questions.json` (static file, loaded at runtime) |
| Storage | Browser `localStorage` |
| Charts | `Chart.js` (CDN, lightweight) |
| Fonts | Google Fonts — Inter |
| Deployment | Static files served locally (`python -m http.server` or Live Server) |

### 10.1 File Structure
```
e:\learn\SSC CGL\
├── PYQ\                          # Source PDFs (84 files)
├── SYALLBUS.pdf
├── DESIGN.md
├── SKILL.md
└── mock-test-app\                # Web Application Root
    ├── index.html                # Entry point
    ├── index.css                 # Design system + all styles
    ├── app.js                    # Main application logic
    ├── data\
    │   └── questions.json        # Generated from parse-pyq.js
    ├── scripts\
    │   └── parse-pyq.js          # Node.js PDF parser (build step)
    └── assets\
        └── icons\                # SVG icons
```

---

## 11. PDF Parser — Detailed Specification (`parse-pyq.js`)

### 11.1 Green Color Detection Logic
PDF.js exposes operator lists per page. Green-filled text operators:
```
setFillColorSpace → setFillColor(0, 1, 0) or approximate green RGB
showText → the text rendered in that color = correct answer option
```

**Detection thresholds:**
- RGB `(r < 100, g > 150, b < 100)` = green → mark option as correct
- OR check annotation layer for highlight annotations with green color

### 11.2 Question Boundary Detection
Questions are separated by regex patterns:
```
/^Q\.\s*\d+\./   →  "Q. 1." start of question
/^\d+\.\s/        →  "1. " start of question  
/^Question\s+\d+/ →  "Question 1" start
```

### 11.3 Option Boundary Detection
```
/^\(A\)|^A\.\s|^A\)/   →  Option A
/^\(B\)|^B\.\s|^B\)/   →  Option B
/^\(C\)|^C\.\s|^C\)/   →  Option C
/^\(D\)|^D\.\s|^D\)/   →  Option D
```

### 11.4 Section Detection
- Questions are grouped by section headers in the PDF:
  - "General Intelligence and Reasoning" / "Reasoning"
  - "General Awareness" / "General Knowledge"
  - "Quantitative Aptitude" / "Mathematics"
  - "English Comprehension" / "English Language"
- Section header → tag all following questions with that section

### 11.5 Topic Auto-Tagging (Keyword Matching)
After extracting question text, run keyword matcher:
```javascript
const TOPIC_KEYWORDS = {
  QUANT_PERCENTAGE: ['percent', '%', 'percentage'],
  QUANT_PROFIT_LOSS: ['profit', 'loss', 'selling price', 'cost price', 'discount'],
  QUANT_TIME_DISTANCE: ['speed', 'distance', 'train', 'boat', 'upstream', 'downstream'],
  // ... (full map for all 45 topics)
  REASON_ANALOGY: ['is related to', '::', 'analogy'],
  REASON_SERIES: ['next term', 'series', 'sequence'],
  ENG_SYNONYMS: ['synonym', 'similar in meaning', 'closest in meaning'],
  // ...
}
```

---

## 12. Acceptance Criteria

### Full Mock Test
- [ ] 100 questions generated (25/section) from PYQ database on start
- [ ] Section selection screen appears before any question
- [ ] Timer starts only after section is selected
- [ ] Switching to another section during active timer is blocked with toast
- [ ] Section auto-advances at 00:00:00; unanswered = unattempted
- [ ] All 4 sections complete → Result screen auto-shown
- [ ] Score calculated: +2 correct, −0.5 wrong, 0 unattempted

### Topic-wise Test
- [ ] Topic selection shows all 45 topics across 4 sections
- [ ] 25 questions drawn randomly from selected topic pool
- [ ] Timer is exactly 15:00 minutes
- [ ] Auto-submit at timer expiry
- [ ] Result shown with accuracy %

### Answer Validation
- [ ] Every marked answer validated against `correct_option` from `questions.json`
- [ ] `correct_option` derived exclusively from PDF green-highlight or answer key
- [ ] No question added to database if correct answer cannot be determined from PDF

### Report
- [ ] Section-wise table: attempted, correct, wrong, unattempted, score, accuracy
- [ ] Donut chart shows correct/wrong/unattempted distribution
- [ ] Each question reviewable with correct answer + explanation
- [ ] Filter: All / Correct / Wrong / Unattempted

---

## 13. Out-of-Scope / Future Enhancements

| Feature | Rationale for Deferral |
|---------|----------------------|
| Image-based questions (figures/diagrams) | PDF image extraction complex; Phase 2 |
| Hindi medium support | English PDFs only in current corpus |
| Leaderboard / multi-user | No backend in scope |
| Adaptive question difficulty | Requires ML; out of scope |
| Mobile app (PWA) | Can convert to PWA in future iteration |
| Audio/video explanations | Not in PDF source |

---

## 14. Open Questions

> [!IMPORTANT]
> Please review and answer these before development begins:

1. **PDF Answer Extraction** — Some PDFs may use image-scanned pages where green color cannot be detected programmatically. Should OCR (Tesseract) be added, or should those PDFs be manually verified?
2. **Image Questions** — Several PYQ questions contain figures (geometry diagrams, figure series, mirror images). How should these be handled? Options:
   - (a) Skip image-based questions entirely
   - (b) Extract and display images inline in the web app
   - (c) Display a note "See original PDF page X for figure"
3. **Duplicate Questions** — Some questions appear across multiple PDFs/years. Should duplicates be deduplicated, or shown from each unique source?
4. **`30 Yearwise` PDFs** — These compilation books may have different formatting than official SSC PDFs. Should they be included in the database, or only the official SSC PDFs used?
5. **Offline vs. Online** — The app is designed to run locally. Should it also be deployable online (e.g., via GitHub Pages)?
6. **Custom Test Length** — Should users be able to create custom tests (e.g., 10 questions, 5 minutes) in addition to the fixed Full/Topic-wise modes?

---

## 15. Implementation Phases

### Phase 1 — Foundation (Week 1)
- [ ] Build `parse-pyq.js` Node.js parser
- [ ] Extract questions from all 84 PDFs into `questions.json`
- [ ] Validate answer extraction accuracy on sample of 20 questions
- [ ] Build `index.html` + `index.css` (design system)

### Phase 2 — Core Features (Week 2)
- [ ] Home screen
- [ ] Full Mock Test: Section selection + question screen + timer + palette
- [ ] Topic-wise Test: Topic selection + question screen + timer
- [ ] Answer submission logic + marking scheme

### Phase 3 — Results & Polish (Week 3)
- [ ] Test Report screen with charts
- [ ] Question review with correct/wrong highlighting + explanations
- [ ] localStorage: history, auto-save, resume
- [ ] Accessibility audit (keyboard nav, ARIA, contrast)

### Phase 4 — QA & Launch (Week 4)
- [ ] Cross-browser testing (Chrome, Edge, Firefox)
- [ ] Answer validation audit (spot-check 100 questions vs PDF)
- [ ] Performance optimization (lazy-load `questions.json`)
- [ ] Final UX polish

---

*End of PRD — SSC CGL PYQ Mock Test Platform v1.0*
