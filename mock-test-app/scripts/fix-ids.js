const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../data/questions.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));

const idCounts = {};
let fixed = 0;

for (const q of data.questions) {
  // clear old image_urls
  delete q.image_url;
  
  if (!idCounts[q.id]) {
    idCounts[q.id] = 1;
  } else {
    idCounts[q.id]++;
    q.id = `${q.id}-${idCounts[q.id]}`;
    fixed++;
  }
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
console.log(`Fixed ${fixed} duplicate IDs.`);
