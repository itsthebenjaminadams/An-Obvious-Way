const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const {test} = require('node:test');
const source = readFileSync(join(__dirname, '../public/assets/report-demo.js'), 'utf8');
const html = readFileSync(join(__dirname, '../public/portfolio/index.html'), 'utf8');
const {summarize, reportCsv} = runInNewContext(source.slice(source.indexOf('  const statuses'), source.indexOf('  const demo')) + '\n({summarize,reportCsv})');

test('the fictional CSV exports only accepted rows with correct escaping and numeric hours', () => {
  const data = [
    [' Intake ', ' Morgan  ', '2.5', 'DONE'],
    ['Needs fixing', '', '3', 'Done'],
    ['Review, phase 2', 'Reese "RJ"', '1.25', ' in progress '],
    ['=literal label', '@literal owner', '0', 'done']
  ];
  assert.equal(reportCsv(summarize(data).accepted),
    'Job,Owner,Hours,Status\r\n"Intake","Morgan","2.50","Done"\r\n"Review, phase 2","Reese ""RJ""","1.25","In progress"\r\n"\'=literal label","\'@literal owner","0.00","Done"\r\n');
  assert.equal(reportCsv([]), 'Job,Owner,Hours,Status\r\n');
});

test('CSV controls are native, inside the initially hidden result, and use no external link', () => {
  const result = html.slice(html.indexOf('data-report-result hidden>'), html.indexOf('<noscript>'));
  assert.match(result, /<button [^>]*data-report-copy-csv/);
  assert.match(result, /<textarea [^>]*data-report-csv-text[^>]*readonly/);
  assert.match(result, /Fictional data from the last run\. Flagged rows are left out\./);
  assert.doesNotMatch(result, /download=|mailto:|<form/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /reset\.addEventListener\('click',[\s\S]*?csvText\.value = ''/);
});
