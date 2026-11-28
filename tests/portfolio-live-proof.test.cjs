const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const page = path => readFileSync(join(__dirname, '../public', path, 'index.html'), 'utf8');

test('live portfolio walkthrough starts at the Contact chooser, not an email app', () => {
  const portfolio = page('portfolio');
  const start = portfolio.indexOf('Try the quote flow yourself');
  const end = portfolio.indexOf('id="short-laptop-proof"');
  assert.ok(start > 0 && end > start);
  const proof = portfolio.slice(start, end);
  assert.match(proof, /href="\/contact\/\?from=quote-walkthrough#quote-choices">Try the live quote chooser/);
  assert.doesNotMatch(proof, /mailto:/);
  assert.match(page('contact'), /id="quote-choices" tabindex="-1"/);
  assert.match(page('contact'), /href="#quote-choices">Choose another template/);
  assert.match(portfolio, /href="\/contact\/#quote-web">Get a quote for your site/);
});

test('the clearly labeled missing-page walkthrough offers a route back to quotes before the fictional labs', () => {
  const portfolio = page('portfolio');
  const start = portfolio.indexOf('id="recovery-proof"');
  const end = portfolio.indexOf('id="example-projects"');
  assert.ok(start > 0 && end > start);
  const proof = portfolio.slice(start, end);
  assert.match(proof, /same recovery screen a visitor sees/);
  assert.match(proof, /href="\/404\.html">Try the missing-page recovery example/);
  assert.doesNotMatch(proof, /mailto:/);
  const recovery = readFileSync(join(__dirname, '../public/404.html'), 'utf8');
  assert.match(recovery, /href="\/contact\/#quote-choices">Request a quote/);
});

test('case-study shortcuts sit outside the closable panel and reach focusable proof before the demos', () => {
  const portfolio = page('portfolio');
  const start = portfolio.indexOf('<nav class="service-chooser" aria-label="Explore the live case study">');
  const finish = portfolio.indexOf('</nav>', start);
  const panel = portfolio.indexOf('data-window-panel="Featured project"');
  const examples = portfolio.indexOf('id="example-projects"');
  assert.ok(start > 0 && finish > start && panel > finish && examples > panel);
  const links = [...portfolio.slice(start, finish).matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(links, ['live-quote-proof', 'short-laptop-proof', 'recovery-proof']);
  const proof = portfolio.slice(panel, examples);
  for (const id of links) assert.match(proof, new RegExp('<h3 id="' + id + '" tabindex="-1">'));
});


test('walkthrough offers a fixed return to the exact proof without changing regular quote entry', () => {
  const { runInNewContext } = require('node:vm');
  const contact = page('contact');
  assert.equal([...contact.matchAll(/data-quote-walkthrough-return hidden href="\/portfolio\/#live-quote-proof"/g)].length, 6);
  const source = readFileSync(join(__dirname, '../public/assets/contact-affordances.js'), 'utf8');
  for (const [search, visible] of [
    ['?from=quote-walkthrough', true],
    ['', false],
    ['?from=pricing', false],
    ['?from=quote-walkthrough&from=other', false]
  ]) {
    const links = [{ hidden: true }, { hidden: true }];
    runInNewContext(source, {
      URLSearchParams,
      document: { querySelector: () => null, querySelectorAll: selector => selector === '[data-quote-walkthrough-return]' ? links : [], addEventListener() {} },
      window: { location: { search, hash: '#quote-choices' }, addEventListener() {} }
    });
    assert.deepEqual(links.map(link => !link.hidden), [visible, visible]);
  }
});
