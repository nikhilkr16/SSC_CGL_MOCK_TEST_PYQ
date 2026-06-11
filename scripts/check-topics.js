const d = require('../data/questions.json');
const topics = {};
d.questions.forEach(q => { topics[q.topic] = (topics[q.topic] || 0) + 1; });
console.log('Total:', d.questions.length);
const sorted = Object.entries(topics).sort((a,b) => b[1]-a[1]);
sorted.forEach(([t,c]) => console.log('  ' + t + ': ' + c));

// Check a few QUANT_ALGEBRA questions
console.log('\nSample QUANT_ALGEBRA questions:');
const algebra = d.questions.filter(q => q.topic === 'QUANT_ALGEBRA').slice(0,3);
algebra.forEach(q => console.log('  Q:', q.question_text.substring(0,80)));

// Check how many have null topic
const nullTopics = d.questions.filter(q => !q.topic);
console.log('\nNull topics:', nullTopics.length);
