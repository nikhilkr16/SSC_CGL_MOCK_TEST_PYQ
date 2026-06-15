#!/usr/bin/env node
/* ============================================================
   apply-patch.js
   Run: node apply-patch.js
   Patches mock-test-app/app.js in-place with the 4 bug fixes.
   Creates a backup at app.js.bak before patching.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');

const APP_JS = path.join(__dirname, 'mock-test-app', 'app.js');
const PATCH  = path.join(__dirname, 'mock-test-app', 'app-patch.js');

if (!fs.existsSync(APP_JS)) {
  console.error('ERROR: mock-test-app/app.js not found. Run from repo root.');
  process.exit(1);
}
if (!fs.existsSync(PATCH)) {
  console.error('ERROR: mock-test-app/app-patch.js not found.');
  process.exit(1);
}

let src = fs.readFileSync(APP_JS, 'utf8');
const patch = fs.readFileSync(PATCH, 'utf8');

// Backup
fs.writeFileSync(APP_JS + '.bak', src, 'utf8');
console.log('✓ Backup saved: app.js.bak');

// ── Replace renderQuestion ─────────────────────────────────
// Find from "function renderQuestion()" to the next top-level "function "
const RQ_START = src.indexOf('\nfunction renderQuestion()');
const RQ_END   = src.indexOf('\nfunction navigateQuestion', RQ_START);

if (RQ_START === -1 || RQ_END === -1) {
  console.error('ERROR: Could not find renderQuestion() in app.js. Manual patch needed.');
  process.exit(1);
}

// Extract the renderQuestion patch from app-patch.js
const patchRQ_Start = patch.indexOf('\nfunction renderQuestion()');
const patchRQ_End   = patch.indexOf('\n\n// ── RENDER REVIEW LIST');
const newRQ = patch.slice(patchRQ_Start, patchRQ_End);

// ── Replace renderReviewList ───────────────────────────────
const RL_START = src.indexOf('\nfunction renderReviewList(');
const RL_END   = src.indexOf('\nfunction filterReviewList(', RL_START);

if (RL_START === -1 || RL_END === -1) {
  console.error('ERROR: Could not find renderReviewList() in app.js. Manual patch needed.');
  process.exit(1);
}

const patchRL_Start = patch.indexOf('\nfunction renderReviewList(');
const newRL = patch.slice(patchRL_Start).trimEnd();

// Apply patches
src = src.slice(0, RQ_START) + newRQ + src.slice(RQ_END);

// Re-find after first replacement (offsets shifted)
const RL_START2 = src.indexOf('\nfunction renderReviewList(');
const RL_END2   = src.indexOf('\nfunction filterReviewList(', RL_START2);
src = src.slice(0, RL_START2) + '\n' + newRL + '\n\n' + src.slice(RL_END2);

fs.writeFileSync(APP_JS, src, 'utf8');
console.log('✓ app.js patched successfully.');
console.log('\nNext steps:');
console.log('  1. node mock-test-app/parse-pyq.js   (re-generate questions.json)');
console.log('  2. Deploy to Vercel as normal');
