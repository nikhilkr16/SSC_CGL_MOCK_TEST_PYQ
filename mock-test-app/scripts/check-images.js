const d = require('../data/questions.json');
const qs = d.questions;

// Count questions with images
const withImg = qs.filter(q => q.image_url);
console.log('Questions with images:', withImg.length, '/', qs.length);
console.log('Without images:', qs.length - withImg.length);

// Show a few examples WITH images
console.log('\n--- Sample questions WITH images ---');
withImg.slice(0, 5).forEach(q => {
  console.log(`  [${q.section}] Q: ${q.question_text.substring(0, 70)}...`);
  console.log(`    Image: ${q.image_url}`);
  console.log();
});

// Show a few examples WITHOUT images
console.log('--- Sample questions WITHOUT images ---');
qs.filter(q => !q.image_url).slice(0, 3).forEach(q => {
  console.log(`  [${q.section}] Q: ${q.question_text.substring(0, 70)}...`);
  console.log(`    Image: none`);
  console.log();
});

// Check file sizes of a few images
const fs = require('fs');
const path = require('path');
const imgDir = path.resolve(__dirname, '../data/images');
const files = fs.readdirSync(imgDir).slice(0, 5);
console.log('--- Sample image file sizes ---');
files.forEach(f => {
  const stat = fs.statSync(path.join(imgDir, f));
  console.log(`  ${f}: ${(stat.size / 1024).toFixed(1)} KB`);
});
