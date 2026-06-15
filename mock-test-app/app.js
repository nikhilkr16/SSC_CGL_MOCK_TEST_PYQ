/* ============================================================
   SSC CGL MOCK TEST — APPLICATION LOGIC
   ============================================================ */

'use strict';

// ── Topic Taxonomy ──────────────────────────────────────────
const TOPIC_MAP = {
  QUANT: {
    label: 'Quantitative Aptitude',
    emoji: '🔢',
    topics: {
      QUANT_NUMBER_SYSTEM:     { label: 'Number System', keywords: ['lcm','hcf','number','divisible','divisibility','factor','remainder','fraction','decimal','digit','prime','even','odd','integer','natural number','whole number'] },
      QUANT_PERCENTAGE:        { label: 'Percentage', keywords: ['percent','%','percentage'] },
      QUANT_RATIO_PROPORTION:  { label: 'Ratio & Proportion', keywords: ['ratio','proportion','proportional','variation','mean proportional'] },
      QUANT_AVERAGE:           { label: 'Average', keywords: ['average','mean','weighted average'] },
      QUANT_INTEREST:          { label: 'Interest (SI/CI)', keywords: ['simple interest','compound interest','rate of interest','principal','amount','annum','per cent per annum'] },
      QUANT_PROFIT_LOSS:       { label: 'Profit & Loss', keywords: ['profit','loss','selling price','cost price','discount','marked price','successive discount','margin'] },
      QUANT_MIXTURE_ALLEGATION:{ label: 'Mixture & Alligation', keywords: ['mixture','alligation','mixed','solution','concentration'] },
      QUANT_TIME_DISTANCE:     { label: 'Time & Distance', keywords: ['speed','distance','train','boat','upstream','downstream','km/h','km/hr','m/s','relative speed','overtake'] },
      QUANT_TIME_WORK:         { label: 'Time & Work', keywords: ['work','days','pipe','cistern','fill','empty','together','alone','efficiency'] },
      QUANT_ALGEBRA:           { label: 'Algebra', keywords: ['algebra','polynomial','equation','identity','x +','x²','x³','surd','root of','if x','quadratic','simplify','value of','expression'] },
      QUANT_GEOMETRY:          { label: 'Geometry', keywords: ['triangle','circle','angle','perpendicular','bisector','tangent','chord','diameter','radius','parallel','congruent','similar','polygon','quadrilateral','rhombus','trapezium','parallelogram','centroid','orthocentre','incentre','circumcentre','median'] },
      QUANT_MENSURATION:       { label: 'Mensuration', keywords: ['area','volume','surface area','perimeter','circumference','cube','cuboid','cylinder','cone','sphere','hemisphere','prism','pyramid','diagonal'] },
      QUANT_TRIGONOMETRY:      { label: 'Trigonometry', keywords: ['sin','cos','tan','cosec','sec','cot','trigonometr','angle of elevation','angle of depression','height','distance','tower','building'] },
      QUANT_STATISTICS:        { label: 'Statistics & DI', keywords: ['mean','median','mode','range','bar graph','pie chart','histogram','data','table','frequency','standard deviation'] },
      QUANT_SQUARE_ROOT:       { label: 'Square & Cube Roots', keywords: ['square root','cube root','√','³√','perfect square','perfect cube'] }
    }
  },
  REASONING: {
    label: 'General Intelligence & Reasoning',
    emoji: '🧠',
    topics: {
      REASON_ANALOGY:            { label: 'Analogy', keywords: ['is related to','::','analogy','in the same way','related pair'] },
      REASON_CLASSIFICATION:     { label: 'Classification (Odd One Out)', keywords: ['odd one','does not belong','different from','odd man','which one is different','classify'] },
      REASON_SERIES:             { label: 'Series', keywords: ['next term','next number','series','sequence','missing number','what comes next','wrong number','wrong term'] },
      REASON_CODING_DECODING:    { label: 'Coding & Decoding', keywords: ['coded as','coding','decoding','code','coded','certain code'] },
      REASON_BLOOD_RELATION:     { label: 'Blood Relations', keywords: ['brother','sister','father','mother','son','daughter','uncle','aunt','nephew','niece','blood relation','family','husband','wife','grandfather','grandmother'] },
      REASON_DIRECTION_DISTANCE: { label: 'Direction & Distance', keywords: ['north','south','east','west','direction','left turn','right turn','facing','walked','starting point'] },
      REASON_RANKING_ARRANGEMENT:{ label: 'Ranking & Arrangement', keywords: ['rank','position','row','top','bottom','ascending','descending','seating','arrangement','left','right'] },
      REASON_SYLLOGISM:          { label: 'Syllogism', keywords: ['statement','conclusion','assumption','all','some','no','syllogism'] },
      REASON_VENN_DIAGRAM:       { label: 'Venn Diagram', keywords: ['venn','diagram','best represent','circle','region'] },
      REASON_MATRIX:             { label: 'Matrix', keywords: ['matrix','row','column','combination'] },
      REASON_FIGURE_COUNTING:    { label: 'Figure Counting', keywords: ['how many triangles','how many squares','count the','number of triangles','number of squares'] },
      REASON_PAPER_FOLDING:      { label: 'Paper Folding & Cutting', keywords: ['paper','fold','punch','cut','unfold'] },
      REASON_MIRROR_WATER:       { label: 'Mirror & Water Image', keywords: ['mirror','water image','reflection'] },
      REASON_EMBEDDED_FIGURE:    { label: 'Embedded Figures', keywords: ['embedded','hidden','figure'] },
      REASON_PATTERN_COMPLETION: { label: 'Pattern Completion', keywords: ['pattern','complete','missing','figure matrix','replace'] },
      REASON_MATHEMATICAL_OPS:   { label: 'Mathematical Operations', keywords: ['interchange','replace sign','mathematical operation','sign','symbol','equation correct','equation balanced'] },
      REASON_DICE_CUBE:          { label: 'Dice & Cube', keywords: ['dice','cube','opposite face','adjacent'] }
    }
  },
  GS: {
    label: 'General Awareness',
    emoji: '🌍',
    topics: {
      GS_HISTORY:           { label: 'History', keywords: ['battle','dynasty','mughal','maurya','gupta','empire','king','ruler','movement','revolt','independence','freedom fighter','mahatma','gandhi','nehru','british','colonial','vedic','harappa','indus'] },
      GS_POLITY:            { label: 'Polity & Constitution', keywords: ['constitution','article','amendment','fundamental','parliament','lok sabha','rajya sabha','president','governor','supreme court','high court','panchayat','election','commission','right','directive','principle','judiciary'] },
      GS_GEOGRAPHY:         { label: 'Geography', keywords: ['river','mountain','plateau','plain','ocean','continent','latitude','longitude','climate','monsoon','earthquake','volcano','soil','mineral','forest','state','capital','boundary','lake','island','peninsula'] },
      GS_ECONOMY:           { label: 'Economy', keywords: ['gdp','inflation','budget','tax','fiscal','monetary','bank','rbi','reserve bank','niti','plan','subsidy','export','import','trade','fdi','gst','revenue','economy','market','share','stock','currency','rupee'] },
      GS_SCIENCE_PHYSICS:   { label: 'Physics', keywords: ['force','motion','gravity','newton','energy','power','electric','current','resistance','voltage','magnet','wave','sound','light','lens','mirror','reflection','refraction','atom','nucleus','pressure','momentum'] },
      GS_SCIENCE_CHEMISTRY: { label: 'Chemistry', keywords: ['element','compound','acid','base','salt','ph','periodic','metal','non-metal','chemical','reaction','oxidation','reduction','carbon','oxygen','hydrogen','nitrogen','alloy','corrosion','polymer','gas','molecule'] },
      GS_SCIENCE_BIOLOGY:   { label: 'Biology', keywords: ['cell','blood','heart','liver','kidney','brain','bone','muscle','vitamin','protein','enzyme','dna','gene','chromosome','disease','virus','bacteria','plant','photosynthesis','respiration','digestion','nervous','hormone','vaccine','antibiotic'] },
      GS_ENVIRONMENT:       { label: 'Environment', keywords: ['environment','ecology','ecosystem','biodiversity','pollution','greenhouse','ozone','global warming','wildlife','national park','sanctuary','conservation','renewable','solar','wind','forest','deforestation'] },
      GS_CURRENT_AFFAIRS:   { label: 'Current Affairs', keywords: ['award','prize','tournament','champion','medal','summit','conference','launched','minister','appointed','inaugurat','scheme','mission','yojana','abhiyan'] },
      GS_CULTURE_ART:       { label: 'Culture & Art', keywords: ['dance','music','painting','festival','temple','folk','classical','raga','instrument','heritage','unesco','art','sculpture','architecture','tribe'] },
      GS_COMPUTER_IT:       { label: 'Computer & IT', keywords: ['computer','software','hardware','internet','website','ram','rom','cpu','binary','programming','algorithm','database','network','byte','keyboard','mouse','printer'] },
      GS_DEFENCE_SCHEMES:   { label: 'Defence & Government Schemes', keywords: ['army','navy','air force','defence','missile','satellite','isro','drdo','exercise','border','security','operation','scheme','yojana','programme','pradhan mantri'] }
    }
  },
  ENGLISH: {
    label: 'English Comprehension',
    emoji: '📖',
    topics: {
      ENG_ERROR_SPOTTING:         { label: 'Error Spotting', keywords: ['error','grammatical error','spot the error','incorrect part','no error'] },
      ENG_FILL_BLANKS:            { label: 'Fill in the Blanks', keywords: ['fill in','blank','suitable word','appropriate word'] },
      ENG_SYNONYMS:               { label: 'Synonyms', keywords: ['synonym','similar in meaning','closest in meaning','same meaning'] },
      ENG_ANTONYMS:               { label: 'Antonyms', keywords: ['antonym','opposite in meaning','opposite meaning','contrary'] },
      ENG_SPELLING:               { label: 'Correct Spelling', keywords: ['correct spelling','correctly spelt','misspelt','misspelled','incorrect spelling'] },
      ENG_IDIOMS_PHRASES:         { label: 'Idioms & Phrases', keywords: ['idiom','phrase','meaning of','proverb','expression means'] },
      ENG_ONE_WORD_SUB:           { label: 'One Word Substitution', keywords: ['one word','substitution','single word','one-word'] },
      ENG_SENTENCE_IMPROVEMENT:   { label: 'Sentence Improvement', keywords: ['improve','improvement','sentence','bold part','underlined','replace','better'] },
      ENG_ACTIVE_PASSIVE:         { label: 'Active/Passive Voice', keywords: ['active','passive','voice','convert','change the voice'] },
      ENG_DIRECT_INDIRECT:        { label: 'Direct/Indirect Speech', keywords: ['direct','indirect','narration','reported speech','change the narration'] },
      ENG_SENTENCE_REARRANGEMENT: { label: 'Sentence Rearrangement', keywords: ['rearrange','jumbled','sequence','para jumble','order','sentence parts'] },
      ENG_READING_COMPREHENSION:  { label: 'Reading Comprehension', keywords: ['passage','read the passage','comprehension','according to the passage','author'] },
      ENG_CLOZE_TEST:             { label: 'Cloze Test', keywords: ['cloze','cloze test','passage','numbered blanks'] }
    }
  },
  MISC: {
    label: 'Miscellaneous',
    emoji: '🧩',
    topics: {
      MISC_UNANSWERED:       { label: 'Unanswered / Uncategorized', keywords: [] },
      MISC_DUPLICATE:        { label: 'Duplicate Questions', keywords: [] }
    }
  }
};

const SECTION_LABELS = {
  QUANT: 'Quantitative Aptitude',
  REASONING: 'Reasoning',
  GS: 'General Awareness',
  ENGLISH: 'English',
  MISC: 'Miscellaneous'
};

const SECTION_EMOJIS = {
  QUANT: '🔢',
  REASONING: '🧠',
  GS: '🌍',
  ENGLISH: '📖',
  MISC: '🧩'
};

// ── Application State ────────────────────────────────────────
const APP = {
  // Database
  db: [],              // all questions from questions.json
  dbLoaded: false,

  // Current screen
  currentScreen: 'home',

  // Test configuration
  testMode: null,      // 'full' | 'topic'
  testType: null,      // 'full' | topic-tag string

  // Full test state
  allSections: ['QUANT', 'REASONING', 'GS', 'ENGLISH'],
  completedSections: [],
  currentSection: null,

  // Questions for current test
  testQuestions: {},    // section/topic → array of questions
  flatQuestions: [],    // flat list for current section/topic
  currentQIndex: 0,

  // Answers
  answers: {},          // questionId → 'A'|'B'|'C'|'D'
  markedForReview: {},  // questionId → true
  visitedQuestions: {}, // questionId → true

  // Timer
  sectionTime: 15 * 60, // 900 seconds
  timeRemaining: 0,
  timerInterval: null,
  sectionTimes: {},     // section → seconds used

  // Results
  testStartTime: null,
  testResults: null,

  // History
  history: []
};

// ── DOM References ──────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Initialize ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  updateHomeStats();
  loadQuestionDB();
  bindEvents();
});

// ── Database Loading ────────────────────────────────────────
async function loadQuestionDB() {
  const statusEl = $('#db-status');
  try {
    const resp = await fetch(`data/questions.json?v=${Date.now()}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    APP.db = data.questions || data;
    APP.dbLoaded = true;
    statusEl.textContent = `✓ ${APP.db.length} questions loaded from PYQ database`;
    statusEl.style.color = 'var(--color-success)';
    // Build topic accordion now that we have the data
    console.log('[SSC] DB loaded, building topic accordion with', APP.db.length, 'questions');
    buildTopicAccordion();
  } catch (err) {
    statusEl.textContent = `⚠ Could not load questions.json — Run parse-pyq.js first`;
    statusEl.style.color = 'var(--color-warning)';
    console.warn('DB load failed:', err);
  }
}

// ── Event Binding ───────────────────────────────────────────
function bindEvents() {
  // Home CTAs
  $('#cta-full-test').addEventListener('click', () => startFullTestFlow());
  $('#cta-topic-test').addEventListener('click', () => showScreen('topic-select'));
  $('#cta-full-test').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startFullTestFlow(); } });
  $('#cta-topic-test').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showScreen('topic-select'); } });

  // Back buttons
  $('#btn-back-home-from-section').addEventListener('click', () => showScreen('home'));
  $('#btn-back-home-from-topic').addEventListener('click', () => showScreen('home'));
  $('#btn-back-home-from-report').addEventListener('click', () => showScreen('home'));

  // Section selection cards
  $('#section-cards-container').addEventListener('click', (e) => {
    const card = e.target.closest('.section-card');
    if (card && !card.classList.contains('completed')) {
      const section = card.dataset.section;
      startSection(section);
    }
  });

  // Section card keyboard
  $('#section-cards-container').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.section-card');
      if (card && !card.classList.contains('completed')) {
        e.preventDefault();
        startSection(card.dataset.section);
      }
    }
  });

  // Test navigation
  $('#btn-prev').addEventListener('click', () => navigateQuestion(-1));
  $('#btn-next').addEventListener('click', () => { saveCurrentAnswer(); navigateQuestion(1); });
  $('#btn-review').addEventListener('click', toggleReview);
  $('#btn-clear').addEventListener('click', clearResponse);
  $('#btn-submit-test').addEventListener('click', confirmSubmit);

  // Option selection
  $$('.option-item').forEach(opt => {
    opt.addEventListener('click', () => selectOption(opt.dataset.option));
  });

  // Report actions
  $('#btn-reattempt-wrong').addEventListener('click', reattemptWrong);
  $('#btn-new-test').addEventListener('click', () => showScreen('home'));

  // Review filters
  $('#review-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.review-filter-btn');
    if (btn) {
      $$('.review-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterReviewList(btn.dataset.filter);
    }
  });

  // Modal
  $('#modal-btn-primary').addEventListener('click', handleModalPrimary);
  $('#modal-btn-secondary').addEventListener('click', hideModal);

  // Build topic accordion (or show placeholder if DB not loaded yet)
  if (APP.dbLoaded) {
    buildTopicAccordion();
  } else {
    const topicContainer = $('#topic-accordion-container');
    topicContainer.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:var(--sp-8);">Loading question database…</p>';
  }
}

// ── Screen Navigation ───────────────────────────────────────
function showScreen(screenId) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(`#screen-${screenId}`).classList.add('active');
  APP.currentScreen = screenId;
  window.scrollTo(0, 0);

  if (screenId === 'home') {
    updateHomeStats();
  } else if (screenId === 'topic-select') {
    // Always rebuild accordion to ensure counts are up-to-date
    buildTopicAccordion();
  }
}

// ── HOME: Stats ─────────────────────────────────────────────
function loadHistory() {
  try {
    const data = localStorage.getItem('ssc_test_history');
    APP.history = data ? JSON.parse(data) : [];
  } catch { APP.history = []; }
}

function saveHistory() {
  try {
    localStorage.setItem('ssc_test_history', JSON.stringify(APP.history.slice(-50)));
  } catch (e) { console.warn('localStorage save failed:', e); }
}

function updateHomeStats() {
  const h = APP.history;
  $('#stat-tests').textContent = h.length;
  if (h.length > 0) {
    const avgAcc = h.reduce((sum, t) => sum + (t.accuracy || 0), 0) / h.length;
    $('#stat-accuracy').textContent = avgAcc.toFixed(1) + '%';
    const best = Math.max(...h.map(t => t.score || 0));
    $('#stat-best').textContent = best.toFixed(1);
  } else {
    $('#stat-accuracy').textContent = '—';
    $('#stat-best').textContent = '—';
  }
}

// ── FULL TEST FLOW ──────────────────────────────────────────
function startFullTestFlow() {
  if (!APP.dbLoaded || APP.db.length === 0) {
    showToast('Question database not loaded. Run parse-pyq.js first.', 'warning');
    return;
  }

  // Reset full test state
  APP.testMode = 'full';
  APP.completedSections = [];
  APP.testQuestions = {};
  APP.answers = {};
  APP.markedForReview = {};
  APP.visitedQuestions = {};
  APP.sectionTimes = {};
  APP.testStartTime = Date.now();
  APP.testResults = null;

  // Randomly select 25 questions per section
  const usedIds = new Set();
  for (const section of APP.allSections) {
    const pool = APP.db.filter(q => q.section === section);
    APP.testQuestions[section] = pickRandom(pool, 25, usedIds);
  }

  // Update section cards
  updateSectionCards();
  showScreen('section-select');
}

function pickRandom(pool, count, usedIds) {
  const available = pool.filter(q => !usedIds.has(q.id));
  const shuffled = shuffleArray([...available]);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));
  picked.forEach(q => usedIds.add(q.id));
  return picked;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateSectionCards() {
  $$('.section-card').forEach(card => {
    const section = card.dataset.section;
    if (APP.completedSections.includes(section)) {
      card.classList.add('completed');
    } else {
      card.classList.remove('completed');
    }
  });
}

// ── START SECTION ───────────────────────────────────────────
function startSection(section) {
  APP.currentSection = section;
  APP.flatQuestions = APP.testQuestions[section] || [];
  APP.currentQIndex = 0;
  APP.timeRemaining = APP.sectionTime;

  if (APP.flatQuestions.length === 0) {
    showToast(`No questions available for ${SECTION_LABELS[section]}`, 'warning');
    return;
  }

  // Mark first question as visited
  if (APP.flatQuestions.length > 0) {
    APP.visitedQuestions[APP.flatQuestions[0].id] = true;
  }

  // Build test UI
  buildTestUI();
  showScreen('test');
  startTimer();
}

// ── TOPIC-WISE TEST ─────────────────────────────────────────
function buildTopicAccordion() {
  const container = $('#topic-accordion-container');
  if (!container) return;
  container.innerHTML = '';

  const dbReady = APP.db && APP.db.length > 0;

  for (const [sectionKey, sectionData] of Object.entries(TOPIC_MAP)) {
    const accordion = document.createElement('div');
    accordion.className = 'topic-accordion';

    // Header
    const header = document.createElement('button');
    header.className = 'topic-section-header';
    header.innerHTML = `
      <span>${sectionData.emoji}</span>
      <span>${sectionData.label}</span>
      <span class="chevron">▼</span>
    `;
    header.addEventListener('click', () => {
      header.classList.toggle('open');
      const list = accordion.querySelector('.topic-list');
      list.classList.toggle('open');
    });

    // Topic list
    const list = document.createElement('div');
    list.className = 'topic-list';

    for (const [topicKey, topicData] of Object.entries(sectionData.topics)) {
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');

      let count = '?';
      if (dbReady) {
        count = 0;
        for (const q of APP.db) {
          if (q.topic === topicKey) count++;
        }
      }
      card.innerHTML = `
        <span class="topic-card-name">${topicData.label}</span>
        <span class="topic-card-count">${count} Qs</span>
      `;
      card.addEventListener('click', () => startTopicTest(topicKey, sectionKey));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startTopicTest(topicKey, sectionKey); }
      });
      list.appendChild(card);
    }

    accordion.appendChild(header);
    accordion.appendChild(list);
    container.appendChild(accordion);
  }
}

function startTopicTest(topicKey, sectionKey) {
  if (!APP.dbLoaded || APP.db.length === 0) {
    showToast('Question database not loaded. Run parse-pyq.js first.', 'warning');
    return;
  }

  const pool = APP.db.filter(q => q.topic === topicKey);
  if (pool.length === 0) {
    showToast(`No questions found for this topic.`, 'warning');
    return;
  }

  // Reset state
  APP.testMode = 'topic';
  APP.testType = topicKey;
  APP.currentSection = sectionKey;
  APP.completedSections = [];
  APP.testQuestions = {};
  APP.answers = {};
  APP.markedForReview = {};
  APP.visitedQuestions = {};
  APP.sectionTimes = {};
  APP.testStartTime = Date.now();
  APP.testResults = null;

  const usedIds = new Set();
  const picked = pickRandom(pool, 25, usedIds);
  APP.testQuestions[topicKey] = picked;
  APP.flatQuestions = picked;
  APP.currentQIndex = 0;
  APP.timeRemaining = APP.sectionTime;

  if (picked.length > 0) {
    APP.visitedQuestions[picked[0].id] = true;
  }

  if (picked.length < 25) {
    showToast(`Only ${picked.length} questions available for this topic.`, 'info');
  }

  buildTestUI();
  showScreen('test');
  startTimer();
}

// ── BUILD TEST UI ───────────────────────────────────────────
function buildTestUI() {
  const section = APP.currentSection;

  // Section badge
  $('#test-section-badge').textContent = APP.testMode === 'full'
    ? SECTION_LABELS[section] || section
    : getTopicLabel(APP.testType) || APP.testType;

  // Section tabs (full test only)
  const tabsEl = $('#test-section-tabs');
  tabsEl.innerHTML = '';
  if (APP.testMode === 'full') {
    for (const s of APP.allSections) {
      const tab = document.createElement('span');
      tab.className = 'test-section-tab';
      if (s === section) tab.classList.add('active');
      else if (APP.completedSections.includes(s)) tab.classList.add('completed');
      else tab.classList.add('locked');

      const icon = APP.completedSections.includes(s) ? '✓' :
                   s === section ? '' : '🔒';
      tab.innerHTML = `${icon ? `<span class="lock-icon">${icon}</span>` : ''}${SECTION_LABELS[s] || s}`;
      tabsEl.appendChild(tab);
    }
  }

  // Progress bar
  if (APP.testMode === 'full') {
    const progress = (APP.completedSections.length / APP.allSections.length) * 100;
    $('#test-progress-fill').style.width = progress + '%';
  } else {
    $('#test-progress-fill').style.width = '0%';
  }

  // Build palette
  buildPalette();

  // Render current question
  renderQuestion();
}

function getTopicLabel(topicKey) {
  for (const section of Object.values(TOPIC_MAP)) {
    if (section.topics[topicKey]) return section.topics[topicKey].label;
  }
  return topicKey;
}

function buildPalette() {
  const grid = $('#palette-grid');
  grid.innerHTML = '';
  const total = APP.flatQuestions.length;

  for (let i = 0; i < total; i++) {
    const btn = document.createElement('button');
    btn.className = 'palette-btn';
    btn.textContent = i + 1;
    btn.setAttribute('aria-label', `Go to question ${i + 1}`);
    btn.addEventListener('click', () => {
      saveCurrentAnswer();
      goToQuestion(i);
    });
    grid.appendChild(btn);
  }
  updatePalette();
}

function updatePalette() {
  const btns = $$('.palette-btn');
  btns.forEach((btn, i) => {
    btn.classList.remove('current', 'answered', 'review', 'visited');
    if (i === APP.currentQIndex) btn.classList.add('current');

    const q = APP.flatQuestions[i];
    if (!q) return;

    if (APP.markedForReview[q.id]) {
      btn.classList.add('review');
    } else if (APP.answers[q.id]) {
      btn.classList.add('answered');
    } else if (APP.visitedQuestions[q.id]) {
      btn.classList.add('visited');
    }
  });
}

// ── RENDER QUESTION ─────────────────────────────────────────
// Bug fixes applied:
//   Bug 2 — image shown ONLY when q.has_image is true (keyword-based)
//   Bug 3 — missing options show a notice instead of blank buttons
//   Bug 4 — underline notice shown when q.has_underline is true
function renderQuestion() {
  const q = APP.flatQuestions[APP.currentQIndex];
  if (!q) return;

  APP.visitedQuestions[q.id] = true;

  // Question number
  $('#question-number').textContent =
    `Question ${APP.currentQIndex + 1} of ${APP.flatQuestions.length}`;

  // ── Question text ────────────────────────────────────────
  const questionTextEl = $('#question-text');
  questionTextEl.style.fontStyle = '';
  questionTextEl.style.opacity   = '';

  // BUG 4 FIX: Underline notice
  let displayText = q.question_text || '';
  questionTextEl.textContent = displayText;

  // Underline warning banner (inject after question text element)
  let underlineNotice = document.getElementById('underline-notice');
  if (!underlineNotice) {
    underlineNotice = document.createElement('div');
    underlineNotice.id = 'underline-notice';
    underlineNotice.style.cssText = `
      display:none;
      margin-top:8px;
      padding:8px 12px;
      background:var(--color-warning-bg);
      border-left:3px solid var(--color-warning);
      border-radius:var(--radius-sm);
      font-size:var(--font-sm);
      color:var(--color-warning);
    `;
    questionTextEl.parentNode.insertBefore(underlineNotice, questionTextEl.nextSibling);
  }
  if (q.has_underline) {
    underlineNotice.textContent =
      '⚠ Underline formatting cannot be extracted from PDF. The word(s) to underline are not visually marked here — refer to the original paper if needed.';
    underlineNotice.style.display = 'block';
  } else {
    underlineNotice.style.display = 'none';
  }

  // ── BUG 2 FIX: Image — only show when has_image is explicitly true ──
  const imgContainer = $('#question-image-container');
  const imgEl        = $('#question-image');

  // Image notice banner for image-based questions without a screenshot
  let imageNotice = document.getElementById('image-notice');
  if (!imageNotice) {
    imageNotice = document.createElement('div');
    imageNotice.id = 'image-notice';
    imageNotice.style.cssText = `
      display:none;
      margin-bottom:12px;
      padding:10px 14px;
      background:var(--color-info-bg);
      border-left:3px solid var(--color-info);
      border-radius:var(--radius-sm);
      font-size:var(--font-sm);
      color:var(--color-info);
    `;
    imgContainer.parentNode.insertBefore(imageNotice, imgContainer);
  }

  if (q.image_url) {
    // Has an actual image URL
    imgEl.src = q.image_url;
    imgEl.alt = `Figure for question ${APP.currentQIndex + 1}`;
    imgContainer.style.display = 'block';
    imageNotice.style.display  = 'none';

    imgEl.onclick = () => {
      imgEl.classList.toggle('zoomed');
      let overlay = $('.question-image-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'question-image-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => {
          imgEl.classList.remove('zoomed');
          overlay.classList.remove('active');
        });
      }
      overlay.classList.toggle('active');
    };
  } else if (q.has_image) {
    // Image question but no screenshot yet — show notice, hide img tag
    imgContainer.style.display = 'none';
    imgEl.src = '';
    imageNotice.innerHTML =
      '📐 <strong>Figure-based question.</strong> The diagram for this question could not be extracted from the PDF. This question is still included and scoreable.';
    imageNotice.style.display = 'block';
  } else {
    // Not an image question at all — show nothing
    imgContainer.style.display = 'none';
    imgEl.src = '';
    imageNotice.style.display  = 'none';
  }

  // ── BUG 3 FIX: Options ───────────────────────────────────
  const options = q.options || {};
  const letters = ['A', 'B', 'C', 'D'];
  const optionsGroup = $('#options-group');

  // Missing-options notice
  let optNotice = document.getElementById('opt-notice');
  if (!optNotice) {
    optNotice = document.createElement('div');
    optNotice.id = 'opt-notice';
    optNotice.style.cssText = `
      display:none;
      padding:10px 14px;
      background:var(--color-warning-bg);
      border-left:3px solid var(--color-warning);
      border-radius:var(--radius-sm);
      font-size:var(--font-sm);
      color:var(--color-warning);
      margin-bottom:12px;
    `;
    optionsGroup.parentNode.insertBefore(optNotice, optionsGroup);
  }

  const hasImageOptions =
    q.has_image_options ||
    (q.has_image && letters.every(l => !(options[l] || '').trim()));

  if (hasImageOptions) {
    optNotice.textContent =
      '⚠ Options are figure-based and could not be extracted from the PDF. Select the option number you believe is correct.';
    optNotice.style.display  = 'block';
    optionsGroup.style.display = '';

    // Show placeholder option buttons (still selectable for scoring)
    letters.forEach((letter, idx) => {
      const optEl  = $(`#option-${letter}`);
      const textEl = $(`#option-text-${letter}`);
      textEl.textContent = `Option ${idx + 1} (see figure)`;
      optEl.classList.remove('selected');
      const radio = optEl.querySelector('.option-radio');
      if (APP.answers[q.id] === letter) {
        optEl.classList.add('selected');
        radio.checked = true;
      } else {
        radio.checked = false;
      }
    });
  } else {
    optNotice.style.display  = 'none';
    optionsGroup.style.display = '';

    letters.forEach(letter => {
      const optEl  = $(`#option-${letter}`);
      const textEl = $(`#option-text-${letter}`);
      textEl.textContent = options[letter] || '';
      optEl.classList.remove('selected');
      const radio = optEl.querySelector('.option-radio');
      if (APP.answers[q.id] === letter) {
        optEl.classList.add('selected');
        radio.checked = true;
      } else {
        radio.checked = false;
      }
    });
  }

  // Remove review states
  $$('.option-item').forEach(o => {
    o.classList.remove('correct', 'wrong');
    const icon = o.querySelector('.option-result-icon');
    if (icon) icon.remove();
  });

  // Review button state
  const reviewBtn = $('#btn-review');
  if (APP.markedForReview[q.id]) {
    reviewBtn.textContent = '⚑ Unmark Review';
    reviewBtn.classList.add('active');
  } else {
    reviewBtn.textContent = '⚑ Mark for Review';
    reviewBtn.classList.remove('active');
  }

  $('#btn-prev').disabled = APP.currentQIndex === 0;
  updatePalette();
}

// ── QUESTION NAVIGATION ────────────────────────────────────
function navigateQuestion(delta) {
  const newIndex = APP.currentQIndex + delta;
  if (newIndex >= 0 && newIndex < APP.flatQuestions.length) {
    goToQuestion(newIndex);
  } else if (newIndex >= APP.flatQuestions.length) {
    // At end — do nothing special
    showToast('You are at the last question.', 'info');
  }
}

function goToQuestion(index) {
  if (index >= 0 && index < APP.flatQuestions.length) {
    APP.currentQIndex = index;
    renderQuestion();
  }
}

// ── ANSWER SELECTION ────────────────────────────────────────
function selectOption(letter) {
  const q = APP.flatQuestions[APP.currentQIndex];
  if (!q) return;

  APP.answers[q.id] = letter;

  // Update visual state
  $$('.option-item').forEach(opt => {
    opt.classList.remove('selected');
    opt.querySelector('.option-radio').checked = false;
  });
  const selected = $(`#option-${letter}`);
  selected.classList.add('selected');
  selected.querySelector('.option-radio').checked = true;

  updatePalette();
}

function saveCurrentAnswer() {
  // Answer is already saved on selection via selectOption
}

function clearResponse() {
  const q = APP.flatQuestions[APP.currentQIndex];
  if (!q) return;

  delete APP.answers[q.id];

  $$('.option-item').forEach(opt => {
    opt.classList.remove('selected');
    opt.querySelector('.option-radio').checked = false;
  });

  updatePalette();
}

function toggleReview() {
  const q = APP.flatQuestions[APP.currentQIndex];
  if (!q) return;

  if (APP.markedForReview[q.id]) {
    delete APP.markedForReview[q.id];
  } else {
    APP.markedForReview[q.id] = true;
  }

  renderQuestion();
}

// ── TIMER ───────────────────────────────────────────────────
function startTimer() {
  stopTimer();
  APP.timeRemaining = APP.sectionTime;
  updateTimerDisplay();

  APP.timerInterval = setInterval(() => {
    APP.timeRemaining--;

    if (APP.timeRemaining <= 0) {
      APP.timeRemaining = 0;
      updateTimerDisplay();
      stopTimer();
      handleTimerExpiry();
      return;
    }

    updateTimerDisplay();

    // ARIA announcements
    if (APP.timeRemaining === 300) { // 5 min
      announce('5 minutes remaining.');
    } else if (APP.timeRemaining === 120) { // 2 min
      announce('Warning: 2 minutes remaining!');
    } else if (APP.timeRemaining === 60) { // 1 min
      announce('Warning: 1 minute remaining!');
    }
  }, 1000);
}

function stopTimer() {
  if (APP.timerInterval) {
    clearInterval(APP.timerInterval);
    APP.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(APP.timeRemaining / 60);
  const secs = APP.timeRemaining % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const timerEl = $('#timer-section');
  timerEl.textContent = display;

  // Warning states
  timerEl.classList.remove('warning', 'danger');
  if (APP.timeRemaining <= 60) {
    timerEl.classList.add('danger');
  } else if (APP.timeRemaining <= 120) {
    timerEl.classList.add('warning');
  }
}

function handleTimerExpiry() {
  const section = APP.currentSection;
  const timeUsed = APP.sectionTime - APP.timeRemaining;

  if (APP.testMode === 'full') {
    APP.sectionTimes[section] = timeUsed;
    APP.completedSections.push(section);

    if (APP.completedSections.length >= APP.allSections.length) {
      // All sections done
      finishTest();
    } else {
      // Show modal to pick next section
      showModal(
        '⏱️',
        'Section Time Expired',
        `Time for ${SECTION_LABELS[section]} is up! All unanswered questions in this section are recorded as unattempted. Choose your next section.`,
        'Choose Next Section',
        null
      );
      APP._modalAction = 'nextSection';
    }
  } else {
    // Topic-wise test — finish
    APP.sectionTimes[APP.testType || section] = timeUsed;
    finishTest();
  }
}

// ── SUBMIT TEST ─────────────────────────────────────────────
function confirmSubmit() {
  if (APP.testMode === 'full') {
    const totalAnswered = Object.keys(APP.answers).length;
    const totalQuestions = APP.allSections.reduce((sum, s) => sum + (APP.testQuestions[s]?.length || 0), 0);

    showModal(
      '⚠️',
      'Submit Test?',
      `You have answered ${totalAnswered} out of ${totalQuestions} questions. Unanswered questions will be marked as unattempted. Are you sure you want to submit?`,
      'Submit',
      'Cancel'
    );
    APP._modalAction = 'submitTest';
  } else {
    const totalAnswered = APP.flatQuestions.filter(q => APP.answers[q.id]).length;
    showModal(
      '⚠️',
      'Submit Test?',
      `You have answered ${totalAnswered} out of ${APP.flatQuestions.length} questions. Are you sure?`,
      'Submit',
      'Cancel'
    );
    APP._modalAction = 'submitTest';
  }
}

function handleModalPrimary() {
  const action = APP._modalAction;
  hideModal();

  if (action === 'nextSection') {
    updateSectionCards();
    showScreen('section-select');
  } else if (action === 'submitTest') {
    stopTimer();
    // Save time for current section
    const section = APP.testMode === 'full' ? APP.currentSection : (APP.testType || APP.currentSection);
    if (!APP.sectionTimes[section]) {
      APP.sectionTimes[section] = APP.sectionTime - APP.timeRemaining;
    }
    if (APP.testMode === 'full' && !APP.completedSections.includes(APP.currentSection)) {
      APP.completedSections.push(APP.currentSection);
    }
    finishTest();
  }
}

// ── FINISH TEST & SCORING ───────────────────────────────────
function finishTest() {
  stopTimer();

  const results = calculateResults();
  APP.testResults = results;

  // Save to history
  APP.history.push({
    date: new Date().toISOString(),
    mode: APP.testMode,
    type: APP.testMode === 'full' ? 'Full Mock' : getTopicLabel(APP.testType),
    score: results.totalScore,
    accuracy: results.accuracy,
    correct: results.totalCorrect,
    wrong: results.totalWrong,
    unattempted: results.totalUnattempted,
    total: results.totalQuestions
  });
  saveHistory();

  renderReport(results);
  showScreen('report');
}

function calculateResults() {
  const results = {
    sections: {},
    totalQuestions: 0,
    totalAttempted: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalUnattempted: 0,
    totalScore: 0,
    accuracy: 0,
    questionDetails: []
  };

  const sectionsToProcess = APP.testMode === 'full'
    ? APP.allSections
    : [APP.testType || APP.currentSection];

  for (const sectionKey of sectionsToProcess) {
    const questions = APP.testQuestions[sectionKey] || [];
    let correct = 0, wrong = 0, unattempted = 0;

    for (const q of questions) {
      const userAnswer = APP.answers[q.id];
      let status;

      if (!userAnswer) {
        unattempted++;
        status = 'unattempted';
      } else if (userAnswer === q.correct_option) {
        correct++;
        status = 'correct';
      } else {
        wrong++;
        status = 'wrong';
      }

      results.questionDetails.push({
        ...q,
        userAnswer,
        status,
        section: sectionKey
      });
    }

    const attempted = correct + wrong;
    const score = (correct * 2) - (wrong * 0.5);
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

    results.sections[sectionKey] = {
      total: questions.length,
      attempted,
      correct,
      wrong,
      unattempted,
      score,
      accuracy,
      timeUsed: APP.sectionTimes[sectionKey] || 0
    };

    results.totalQuestions += questions.length;
    results.totalAttempted += attempted;
    results.totalCorrect += correct;
    results.totalWrong += wrong;
    results.totalUnattempted += unattempted;
    results.totalScore += score;
  }

  results.accuracy = results.totalAttempted > 0
    ? (results.totalCorrect / results.totalAttempted) * 100
    : 0;

  return results;
}

// ── RENDER REPORT ───────────────────────────────────────────
function renderReport(results) {
  const maxScore = APP.testMode === 'full' ? 200 : results.totalQuestions * 2;

  // Subtitle
  $('#report-subtitle').textContent = APP.testMode === 'full'
    ? 'Full Mock Test — Completed'
    : `Topic: ${getTopicLabel(APP.testType)} — Completed`;

  // Score circle
  const scorePercent = maxScore > 0 ? Math.max(0, results.totalScore) / maxScore : 0;
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference * (1 - scorePercent);
  const ring = $('#score-ring');
  ring.style.strokeDasharray = circumference;
  // Animate
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);

  // Set color based on score
  if (scorePercent >= 0.6) ring.style.stroke = 'var(--color-success)';
  else if (scorePercent >= 0.3) ring.style.stroke = 'var(--color-warning)';
  else ring.style.stroke = 'var(--color-danger)';

  $('#score-number').textContent = results.totalScore.toFixed(1);
  $('#score-total').textContent = `/ ${maxScore}`;

  // Metrics
  $('#metric-accuracy').textContent = results.accuracy.toFixed(1) + '%';
  $('#metric-correct').textContent = results.totalCorrect;
  $('#metric-wrong').textContent = results.totalWrong;
  $('#metric-unattempted').textContent = results.totalUnattempted;

  // Section breakdown table
  renderBreakdownTable(results);

  // Charts
  renderCharts(results);

  // Question review
  renderReviewList(results);

  // Reattempt button visibility
  $('#btn-reattempt-wrong').style.display = results.totalWrong > 0 ? 'inline-flex' : 'none';
}

function renderBreakdownTable(results) {
  const tbody = $('#report-breakdown-body');
  tbody.innerHTML = '';

  for (const [key, data] of Object.entries(results.sections)) {
    const label = SECTION_LABELS[key] || getTopicLabel(key) || key;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="text-align:left; font-weight:var(--fw-semibold);">${label}</td>
      <td>${data.total}</td>
      <td>${data.attempted}</td>
      <td style="color:var(--color-success)">${data.correct}</td>
      <td style="color:var(--color-danger)">${data.wrong}</td>
      <td style="color:var(--color-text-muted)">${data.unattempted}</td>
      <td style="font-weight:var(--fw-bold)">${data.score.toFixed(1)}</td>
      <td>${data.accuracy.toFixed(1)}%</td>
    `;
    tbody.appendChild(row);
  }

  // Total row
  const totalRow = document.createElement('tr');
  totalRow.className = 'total-row';
  totalRow.innerHTML = `
    <td style="text-align:left; font-weight:var(--fw-bold);">Total</td>
    <td>${results.totalQuestions}</td>
    <td>${results.totalAttempted}</td>
    <td style="color:var(--color-success)">${results.totalCorrect}</td>
    <td style="color:var(--color-danger)">${results.totalWrong}</td>
    <td style="color:var(--color-text-muted)">${results.totalUnattempted}</td>
    <td style="font-weight:var(--fw-bold)">${results.totalScore.toFixed(1)}</td>
    <td>${results.accuracy.toFixed(1)}%</td>
  `;
  tbody.appendChild(totalRow);
}

// ── CHARTS ──────────────────────────────────────────────────
let donutChart = null;
let barChart = null;

function renderCharts(results) {
  // Destroy existing charts
  if (donutChart) { donutChart.destroy(); donutChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }

  // Donut chart
  const donutCtx = $('#chart-donut').getContext('2d');
  donutChart = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Correct', 'Wrong', 'Unattempted'],
      datasets: [{
        data: [results.totalCorrect, results.totalWrong, results.totalUnattempted],
        backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
        borderColor: ['#16a34a', '#dc2626', '#4b5563'],
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#8892a4',
            font: { family: 'Inter', size: 11 },
            padding: 16
          }
        }
      }
    }
  });

  // Bar chart (section-wise accuracy)
  if (APP.testMode === 'full') {
    const labels = [];
    const data = [];
    const colors = [];
    for (const s of APP.allSections) {
      const sec = results.sections[s];
      if (sec) {
        labels.push(SECTION_LABELS[s] || s);
        data.push(sec.accuracy);
        colors.push(sec.accuracy >= 60 ? '#22c55e' : sec.accuracy >= 30 ? '#f59e0b' : '#ef4444');
      }
    }

    const barCtx = $('#chart-bar').getContext('2d');
    barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Accuracy %',
          data,
          backgroundColor: colors,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        scales: {
          x: {
            max: 100,
            ticks: { color: '#8892a4', font: { family: 'Inter', size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#8892a4', font: { family: 'Inter', size: 11 } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

// ── QUESTION REVIEW LIST (FIXED) ────────────────────────────
// Handles image-only options and underline notices in report view too
function renderReviewList(results) {
  const list = $('#review-list');
  list.innerHTML = '';

  for (let i = 0; i < results.questionDetails.length; i++) {
    const q = results.questionDetails[i];
    const item = document.createElement('div');
    item.className  = 'review-item';
    item.dataset.status = q.status;

    const statusIcon = q.status === 'correct' ? '✓' : q.status === 'wrong' ? '✗' : '—';

    const opts = q.options || {};
    const letters = ['A', 'B', 'C', 'D'];
    const hasImageOpts = q.has_image_options ||
      (q.has_image && letters.every(l => !(opts[l] || '').trim()));

    const userAnswerText = q.userAnswer
      ? (hasImageOpts
          ? `Option ${['A','B','C','D'].indexOf(q.userAnswer) + 1} (figure-based)`
          : `${q.userAnswer}. ${opts[q.userAnswer] || ''}`)
      : 'Not Attempted';

    const correctAnswerText = q.correct_option
      ? (hasImageOpts
          ? `Option ${['A','B','C','D'].indexOf(q.correct_option) + 1} (figure-based)`
          : `${q.correct_option}. ${opts[q.correct_option] || ''}`)
      : 'N/A';

    const underlineNote = q.has_underline
      ? `<div style="margin-top:8px;padding:6px 10px;background:var(--color-warning-bg);border-left:3px solid var(--color-warning);border-radius:var(--radius-sm);font-size:var(--font-xs);color:var(--color-warning);">
           ⚠ Underline formatting not available — refer to original PDF.
         </div>`
      : '';

    const imageNote = q.has_image && !q.image_url
      ? `<div style="margin-bottom:8px;padding:6px 10px;background:var(--color-info-bg);border-left:3px solid var(--color-info);border-radius:var(--radius-sm);font-size:var(--font-xs);color:var(--color-info);">
           📐 Figure-based question — diagram not extracted.
         </div>`
      : '';

    item.innerHTML = `
      <div class="review-item-header" tabindex="0" role="button"
           aria-label="Expand question ${i + 1}">
        <span class="review-status ${q.status}">${statusIcon}</span>
        <span class="review-q-text">Q${i + 1}. ${q.question_text}</span>
        <span class="review-expand-icon">▼</span>
      </div>
      <div class="review-item-body">
        ${imageNote}
        ${q.image_url
          ? `<div style="text-align:center;margin-bottom:var(--sp-3);">
               <img src="${q.image_url}" alt="Question figure" class="question-image" style="max-height:250px;" />
             </div>`
          : ''}
        ${underlineNote}
        <div class="review-answer-row">
          <span class="review-label">Your Answer:</span>
          <span style="color:${
            q.status === 'correct' ? 'var(--color-success)' :
            q.status === 'wrong'   ? 'var(--color-danger)'  :
                                     'var(--color-text-muted)'}">
            ${userAnswerText}
          </span>
        </div>
        <div class="review-answer-row">
          <span class="review-label">Correct Answer:</span>
          <span style="color:var(--color-success);font-weight:var(--fw-semibold);">
            ${correctAnswerText}
          </span>
        </div>
        ${q.explanation
          ? `<div class="review-explanation">💡 ${q.explanation}</div>` : ''}
        <div class="review-answer-row" style="margin-top:var(--sp-2);">
          <span class="review-label">Source:</span>
          <span style="color:var(--color-text-muted);font-size:var(--font-xs);">
            ${q.source_pdf || 'Unknown'} (${q.year || ''}) · ${q.shift || ''}
          </span>
        </div>
      </div>
    `;

    const header = item.querySelector('.review-item-header');
    header.addEventListener('click', () => item.classList.toggle('expanded'));
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.classList.toggle('expanded');
      }
    });

    list.appendChild(item);
  }
}

function filterReviewList(filter) {
  const items = $$('.review-item');
  items.forEach(item => {
    if (filter === 'all' || item.dataset.status === filter) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// ── REATTEMPT WRONG ─────────────────────────────────────────
function reattemptWrong() {
  if (!APP.testResults) return;

  const wrongQs = APP.testResults.questionDetails.filter(q => q.status === 'wrong');
  if (wrongQs.length === 0) {
    showToast('No wrong answers to reattempt!', 'info');
    return;
  }

  // Set up as a topic-like test with wrong questions
  APP.testMode = 'topic';
  APP.testType = 'REATTEMPT_WRONG';
  APP.currentSection = 'MIXED';
  APP.completedSections = [];
  APP.testQuestions = { REATTEMPT_WRONG: wrongQs };
  APP.answers = {};
  APP.markedForReview = {};
  APP.visitedQuestions = {};
  APP.sectionTimes = {};
  APP.testStartTime = Date.now();
  APP.testResults = null;

  APP.flatQuestions = wrongQs;
  APP.currentQIndex = 0;
  APP.timeRemaining = APP.sectionTime;

  if (wrongQs.length > 0) APP.visitedQuestions[wrongQs[0].id] = true;

  buildTestUI();
  showScreen('test');
  startTimer();
}

// ── MODAL ───────────────────────────────────────────────────
function showModal(icon, title, text, primaryBtn, secondaryBtn) {
  $('#modal-icon').textContent = icon;
  $('#modal-title').textContent = title;
  $('#modal-text').textContent = text;
  $('#modal-btn-primary').textContent = primaryBtn;

  if (secondaryBtn) {
    $('#modal-btn-secondary').textContent = secondaryBtn;
    $('#modal-btn-secondary').style.display = 'inline-flex';
  } else {
    $('#modal-btn-secondary').style.display = 'none';
  }

  $('#modal-overlay').classList.add('active');
}

function hideModal() {
  $('#modal-overlay').classList.remove('active');
}

// ── TOAST ───────────────────────────────────────────────────
let toastTimeout = null;

function showToast(message, type = 'info') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = 'toast';
  if (type === 'warning') toast.classList.add('toast-warning');
  else if (type === 'danger') toast.classList.add('toast-danger');
  else if (type === 'success') toast.classList.add('toast-success');

  clearTimeout(toastTimeout);
  requestAnimationFrame(() => {
    toast.classList.add('visible');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  });
}

// ── ARIA ANNOUNCER ──────────────────────────────────────────
function announce(message) {
  const el = $('#aria-announcer');
  el.textContent = '';
  setTimeout(() => { el.textContent = message; }, 50);
}
