const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const file = path => readFileSync(join(__dirname, '..', 'public', path), 'utf8');
test('comparing services works without JS and does not clear the finder choice', () => {
  const html = file('services/index.html');
  assert.match(html, /data-finder-signal>\s*<p [^>]*data-finder-status[^>]* hidden><\/p>\s*<a [^>]*href="#all-services">Compare all services<\/a>/);
  assert.match(html, /id="all-services" tabindex="-1"/);
  const choices = Array.from({length: 4}, () => ({
    open: false, addEventListener(type, cb) { this[type] = cb; }
  }));
  const status = { hidden: true, textContent: '' };
  const diagnostic = {
    querySelector(selector) {
      assert.equal(selector, '[data-finder-status]');
      return status;
    }
  };
  const document = {
    querySelector: selector => selector === '[data-finder-signal]' ? diagnostic : null,
    querySelectorAll: selector => selector === '.finder-list details' ? choices : []
  };
  vm.runInNewContext(file('assets/page-interactions.js'), { document });
  assert.equal(status.hidden, false);
  assert.equal(status.textContent, '');
  choices[1].open = true;
  choices[1].toggle();
  assert.equal(status.textContent, 'Suggested starting point: Web development');
  assert.equal(choices[1].open, true);
  choices[1].open = false;
  choices[3].open = true;
  choices[3].toggle();
  assert.equal(status.textContent, 'You can start without choosing a service.');
});
