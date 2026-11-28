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

test('compact comparison links to exact service cards and uses their published price units', () => {
  const html = file('services/index.html');
  const comparison = html.split('<ul class="service-comparison"')[1].split('</ul>')[0];
  const rows = [...comparison.matchAll(/<a href="#([^"]+)"><strong>([^<]+)<\/strong><span class="comparison-scope">([^<]+)<\/span><span class="comparison-price">([^<]+)<\/span>/g)];
  assert.deepEqual(rows.map(row => row[1]), ['tech-support', 'web-development', 'workflow-automation']);
  for (const [, id, title, scope, price] of rows) {
    const card = html.split('id="' + id + '" tabindex="-1"')[1].split('</article>')[0];
    assert.ok(scope.trim());
    assert.ok(card.includes('<h2>' + title + '</h2>'));
    assert.ok(card.includes('<div class="price">' + price + '</div>'));
  }
  assert.match(html, /id="all-services" tabindex="-1" aria-labelledby="service-comparison-title"/);
  assert.match(html, /id="service-comparison-title" tabindex="-1">Compare services at a glance/);
  assert.match(html, /<\/ul>\s*<a class="text-link comparison-finder-link" href="#service-finder">Not sure\? Find a service by goal/);
});

test('buyers get one set of named service links before the offer details', () => {
  const html = file('services/index.html');
  const firstChoices = html.slice(html.indexOf('<h1 '), html.indexOf('<article class="card" id="tech-support"'));
  const destinations = [...firstChoices.matchAll(/<a [^>]*href="#([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(destinations, ['tech-support', 'web-development', 'workflow-automation', 'service-finder']);
});

test('explicit finder links open the disclosure without opening it when a cached page returns', () => {
  const html = file('services/index.html');
  assert.match(html, /href="#service-finder">Not sure\? Find a service by goal /);
  assert.match(html, /<details class="section" data-service-finder>\s*<summary id="service-finder">/);
  const disclosure = {open:false, querySelector: () => ({id:'service-finder'})};
  const diagnostic = {querySelector: () => ({}), closest: () => disclosure};
  const document = {querySelector: sel => sel === '[data-finder-signal]' ? diagnostic : null, querySelectorAll: () => [], addEventListener(type, cb) { this[type] = cb; }};
  const window = { location: { hash: '#service-finder', href: 'https://test.invalid/services/#service-finder' }, addEventListener(type, cb) { this[type] = cb; } };
  vm.runInNewContext(file('assets/page-interactions.js'), {document,window});
  assert(disclosure.open);
  disclosure.open = false;
  assert.equal(window.pageshow,undefined);
  const click = (options = {}) => document.click({button:0,target:{closest: () => ({href:window.location.href,hasAttribute:()=>false})},...options});
  click({ctrlKey:true});
  assert(!disclosure.open);
  click();
  assert(disclosure.open);
  disclosure.open = false;
  window.location.hash = '#all-services';
  window.hashchange();
  assert(!disclosure.open);
  window.location.hash = '#service-finder';
  window.hashchange();
  assert(disclosure.open);
});

test('every offer returns to a focusable comparison heading without JavaScript', () => {
  const html = file('services/index.html');
  const css = file('assets/service-comparison.css');
  const returnLink = /<a class="text-link service-return" href="#service-comparison-title">Back to service comparison /;
  for (const offer of ['tech-support', 'web-development', 'workflow-automation']) {
    const card = html.split('id="' + offer + '" tabindex="-1"')[1].split('</article>')[0];
    assert.match(card, returnLink);
  }
  const estimator = html.split('id="workflow-time" tabindex="-1"')[1].split('</section>')[0];
  assert.match(estimator, /href="\/contact\/#quote-automation">Discuss this workflow in a quote /);
  assert.match(estimator, /href="#workflow-automation">Back to workflow automation details /);
  assert.match(css, /\.service-return\s*\{[^}]*min-height:\s*44px/);
});
