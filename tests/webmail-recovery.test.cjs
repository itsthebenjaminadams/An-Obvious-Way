'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const read = name => fs.readFileSync(path.join(__dirname, '../public', name), 'utf8');
const kinds = ['general', 'support', 'web', 'automation'];

test('webmail links point inside the original native disclosures and keep manual-copy fields', () => {
  const html = read('contact/index.html');
  assert.match(html, /href="#webmail-general">No email app\? Use webmail<\/a>/);
  for (const kind of kinds) {
    const target = 'webmail-' + kind;
    const group = html.split('<details class="quote-template" data-quote-template>').find(part => part.startsWith('\n    <summary id="' + target + '-label"')).split('</details>')[0];
    assert.match(group, new RegExp('id="' + target + '" tabindex="-1" role="group" aria-labelledby="' + target + '-label"'));
    assert.match(group, new RegExp('id="template-' + kind + '-to"[^>]*value="contact@anobviousway.com"[^>]*readonly'));
    assert.match(group, new RegExp('id="template-' + kind + '-subject"[^>]*readonly'));
    assert.match(group, new RegExp('<textarea id="template-' + kind + '"[^>]*readonly'));
    assert.doesNotMatch(group, /mailto:|<form/);
  }
});

test('Quick Find routes explicit webmail intent to an exact service or a general template', () => {
  const s = read('assets/quick-find.js');
  const search = vm.runInNewContext(s.slice(s.indexOf('  // Path, label'), s.indexOf('  function make(')) + '\nsearch');
  for (const [query, suffix] of Object.entries({
    'Email app didn’t open': 'webmail-general', 'Use webmail': 'webmail-general', 'Copy a quote template': 'webmail-general',
    'Website quote webmail': 'webmail-web', 'copy a tech support quote template': 'webmail-support',
    'Webmail automation quote': 'webmail-automation', 'Website quote': 'quote-web',
    'Website webmail': 'webmail-web', 'webmail for my website': 'webmail-web',
    'webmail quote for website design': 'webmail-web', 'Quote webmail tech support': 'webmail-support',
    'Webmail for computer repair': 'webmail-support', 'WI-FI support webmail': 'webmail-support',
    'Workflow automation webmail': 'webmail-automation', 'webmail for spreadsheet automation': 'webmail-automation'
  })) assert.equal(search(query)[0]?.url, '/contact/#' + suffix, query);
  for (const query of [
    'webmail website quote without email', 'no webmail for website', 'webmail not website',
    'website or automation webmail', 'website and automation webmail', 'website webmail migration',
    'webmail website security', 'website webmail '.padEnd(80, ' ')
  ]) assert.ok(!search(query)?.some(item => item.url.startsWith('/contact/#webmail-')), query);
});

test('deep links open and focus only the requested fields; same-link reopening honors modifiers', () => {
  let focused; let scrolls = 0;
  const ev = {}; const win = {};
  const at = {hash: '#webmail-web', href: 'https://example.test/contact/#webmail-web'};
  const groups = Object.fromEntries(kinds.map(kind => ['webmail-' + kind, {open: false}]));
  const fields = Object.fromEntries(Object.entries(groups).map(([id, group]) => [id, {
    closest: () => group,
    focus(opts) { assert(group.open); assert.equal(opts.preventScroll, true); focused = id; },
    scrollIntoView(opts) { assert.equal(opts.block, 'start'); scrolls++; }
  }]));
  vm.runInNewContext(read('assets/contact-affordances.js'), {
    document: {querySelector: () => null, querySelectorAll: () => [], getElementById: id => fields[id], addEventListener(type, cb) { ev[type] = cb; }},
    window: {location: at, addEventListener(type, cb) { win[type] = cb; }}
  });
  assert.equal(focused, 'webmail-web');
  assert.equal(groups['webmail-general'].open, false);
  groups['webmail-web'].open = false;
  const anchor = {href: at.href, target: '', hasAttribute: () => false};
  const click = {button: 0, target: {closest: () => anchor}};
  ev.click({...click, ctrlKey: true});
  assert.equal(groups['webmail-web'].open, false);
  ev.click(click);
  assert.equal(groups['webmail-web'].open, true);
  at.hash = '#quote-support';
  win.hashchange();
  assert.equal(scrolls, 2);
  at.hash = '#webmail-support';
  win.hashchange();
  assert.equal(focused, 'webmail-support');
  assert.equal(groups['webmail-web'].open, true);
});
