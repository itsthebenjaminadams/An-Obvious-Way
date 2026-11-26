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
  ['quote', '/contact/#quote-choices'],
  ['quotes', '/contact/#quote-choices'],
  ['get a quote', '/contact/#quote-choices'],
  ['request a quote', '/contact/#quote-choices'],
  ['describe your project', '/contact/#quote-general'],
  ['prepare a quote request', '/contact/#preflight-title'],
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
const spokenFirst = new Map([
  ['How much does it cost to fix my Wi-Fi?', '/services/#tech-support'],
  ['How much would a new website cost?', '/services/#web-development'],
  ['Can you help me with my Wi-Fi?', '/services/#tech-support'],
  ['Can you clean up my spreadsheet?', '/services/#workflow-automation'],
  ['clean up my spreadsheet', '/services/#workflow-automation'],
  ['What does a website cost?', '/services/#web-development'],
  ['Can someone help with a laptop?', '/services/#tech-support'],
  ['I need someone to fix my Wi-Fi', '/services/#tech-support'],
  ['Can you help with my website?', '/services/#web-development'],
  ['Can you help me with a website quote?', '/contact/#quote-web'],
]);
for (const [query, url] of spokenFirst) assert.equal(search(query)?.[0]?.url, url, query);
for (const query of [
  'clean up my registry', 'clean up my spreadsheet without Excel',
  'Can you help with car brakes?', 'Can someone help with my fridge?', 'Can you help with pancakes?',
  'Can you help with Mac support?', 'Can you help with my website without hosting?',
  'Can you help with my Wi-Fi but not a website?', 'Can you help with my Wi-Fi instead of my website?',
  'Can you help with my website? I don’t want hosting.', 'Can you help with my Wi-Fi except at night?',
  'Can you help with my website?' + ' '.repeat(65) + ' except hosting',
]) assert.equal(search(query)?.length, 0, query);

if (process.argv[2]) {
  const prior = fs.readFileSync(process.argv[2], 'utf8');
  const previousSearch = vm.runInNewContext(prior.slice(prior.indexOf('  // Path, label'), prior.indexOf('  function make(')) + '\nsearch');
  for (const query of first.keys()) {
    const urls = (fn) => Array.from(fn(query), result => result.url);
    assert.deepEqual(urls(search), urls(previousSearch), 'Full result order: ' + query);
  }
  console.log('All ' + first.size + ' established positive queries keep their full original result order.');
}
for (const dash of ['\u2010', '\u2011', '\u2012', '\u2013', '\u2014', '\u2015']) {
  for (const topic of ['Wi-Fi', 'Wi-Fi quote', 'Wi-Fi keeps dropping', 'Mac Wi-Fi repair', 'Wi-Fi without router']) {
    assert.deepEqual(Array.from(search(topic.replace('-', dash), x => x.url), x => x.url),
      Array.from(search(topic), x => x.url), topic + ': ' + dash);
  }
}
for (const query of ['My Wi‑Fi keeps disconnecting', 'My network keeps disconnecting', 'My PC keeps disconnecting',
  'My Windows laptop keeps disconnecting', 'My internet keeps disconnecting']) {
  assert.equal(search(query)?.[0]?.url, '/services/#tech-support', query);
}
assert.equal(search('My Wi‑Fi keeps disconnecting quote')?.[0]?.url, '/contact/#quote-support');
for (const query of ['disconnecting', 'keeps disconnecting', 'My iPhone keeps disconnecting',
  'My Bluetooth headphones keep disconnecting', 'My Wi‑Fi keeps disconnecting without a router',
  'My Wi‑Fi keeps disconnecting and need hosting', 'My Ethernet keeps disconnecting']) {
  assert.equal(search(query)?.length, 0, query);
}
console.log('75 existing regressions plus symptom and punctuation cases passed.');
