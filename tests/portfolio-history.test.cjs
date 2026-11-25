const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../public/assets/portfolio-storefront.js'), 'utf8');

test('Portfolio opens explicit demo links without reopening collapsed demos on history return', () => {
  const location = { hash: '#support-puzzle', href: 'https://site.example/portfolio/#support-puzzle' };
  const disclosure = { open: false };
  const scroll = [];
  const summary = {
    closest: (selector) => selector === 'details[data-portfolio-lab]' ? disclosure : null,
    scrollIntoView: (options) => scroll.push(options.block)
  };
  const events = {};
  const window = {
    location,
    requestAnimationFrame: (fn) => fn(),
    addEventListener: (type, listener) => { events[type] = listener; }
  };
  const document = {
    getElementById: (id) => id === 'support-puzzle' || id === 'report-demo-title' ? summary : null,
    addEventListener: (type, listener) => { events[type] = listener; }
  };
  vm.runInNewContext(source, { window, document });
  assert.equal(disclosure.open, true);
  assert.deepEqual(scroll, ['start']);
  disclosure.open = false;
  events.pageshow?.({ persisted: true });
  assert.equal(disclosure.open, false);
  assert.deepEqual(scroll, ['start']);
  const target = { closest: () => ({ href: location.href }) };
  events.click({ button: 0, target, ctrlKey: true });
  assert.equal(disclosure.open, false);
  events.click({ button: 0, target });
  assert.equal(disclosure.open, true);
  disclosure.open = false;
  location.hash = '#report-demo-title';
  events.hashchange();
  assert.equal(disclosure.open, true);
});
