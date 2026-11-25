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
