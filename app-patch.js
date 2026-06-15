// ============================================================
// PATCH FILE — copy these two functions into app.js
// They REPLACE the existing renderQuestion() and renderReviewList()
// Everything else in app.js stays exactly the same.
// ============================================================

// ── RENDER QUESTION (FIXED) ──────────────────────────────────
// Bug fixes applied:
//   Bug 1 — section is already correct in questions.json (parser fix)
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

  if (q.has_image && q.image_url) {
    // Has both flag and actual image URL
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
  } else if (q.has_image && !q.image_url) {
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


// ── RENDER REVIEW LIST (FIXED) ────────────────────────────────
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
