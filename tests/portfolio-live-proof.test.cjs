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
  assert.match(proof, /href="\/contact\/#quote-choices">Try the live quote chooser/);
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
