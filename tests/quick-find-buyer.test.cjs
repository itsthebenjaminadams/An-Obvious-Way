'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'quick-find.js'), 'utf8');
const indexStart = source.indexOf('  // Path, label');
const uiStart = source.indexOf('  function make(');
assert(indexStart >= 0 && uiStart > indexStart, 'Locate the unchanged search-engine boundaries');
const search = vm.runInNewContext(source.slice(indexStart, uiStart) + '\nsearch');
const first = new Map([
  ['Wi-Fi keeps dropping', '/services/#tech-support'],
  ['my wifi keeps dropping', '/services/#tech-support'],
  ['Wi-Fi keeps dropping quote', '/contact/#quote-support'],
  ['website redesign', '/services/#web-development'],
  ['spreadsheet cleanup', '/services/#workflow-automation'],
  ['fix my spreadsheet', '/services/#workflow-automation'],
  ['automate a weekly report', '/services/#workflow-automation'],
  ['weekly report automation', '/services/#workflow-automation'],
  ['report', '/services/#workflow-automation'],
  ['new website quote', '/contact/#quote-web'],
  ['website quote', '/contact/#quote-web'],
  ['small-business website quote', '/contact/#quote-web'],
  ['small business websites quote', '/contact/#quote-web'],
  ['website pricing', '/services/#web-development'],
  ['small business website pricing', '/services/#web-development'],
  ['small-business website prices', '/services/#web-development'],
  ['website redesign cost', '/services/#web-development'],
  ['small business website quote', '/contact/#quote-web'],
  ['website prices', '/services/#web-development'],
  ['website price', '/services/#web-development'],
  ['website case study', '/portfolio/#featured-project'],
  ['Wi-Fi quote', '/contact/#quote-support'],
  ['computer repair quote', '/contact/#quote-support'],
  ['repair', '/services/#tech-support'],
  ['Wi-Fi diagnostic price', '/services/#tech-support'],
  ['computer diagnostic price', '/services/#tech-support'],
  ['diagnostic cost', '/services/#tech-support'],
  ['how much is a Wi-Fi diagnostic', '/services/#tech-support'],
  ['tech support pricing', '/services/#tech-support'],
  ['support rates', '/services/#tech-support'],
  ['Wi-Fi repair cost', '/services/#tech-support'],
  ['automation pricing', '/services/#workflow-automation'],
  ['spreadsheet cleanup pricing', '/services/#workflow-automation'],
  ['report automation pricing', '/services/#workflow-automation'],
  ['spreadsheet cleanup quote', '/contact/#quote-automation'],
  ['weekly report quote', '/contact/#quote-automation'],
  ['Wi-Fi diagnostic quote', '/contact/#quote-support'],
  ['pricing', '/services/#all-services'],
  ['dropping call', '/portfolio/#support-puzzle'],
  ['report repair lab', '/portfolio/#report-demo-title'],
  ['report repair challenge', '/portfolio/#report-demo-title'],
  ['demo', '/portfolio/#report-demo-title'],
]);
for (const [query, url] of first) assert.equal(search(query)?.[0]?.url, url, query);
for (const query of ['phone screen pricing', 'Mac support pricing', 'website hosting pricing', 'hosting pricing', 'free website', 'Mac repair', 'WordPress website', 'iPhone screen repair', 'unrelated fictitious need']) {
  assert.equal(search(query)?.length, 0, query);
}
const pricingUrls = Array.from(search('pricing'), result => result.url);
for (const service of ['tech-support', 'web-development', 'workflow-automation']) {
  assert(pricingUrls.includes('/services/#' + service), 'Generic pricing includes ' + service);
}
console.log('47 Quick Find query regressions plus full generic pricing coverage passed.');
