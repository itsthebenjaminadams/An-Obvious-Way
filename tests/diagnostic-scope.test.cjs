const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

function card(page, id) {
  const html = readFileSync(join(__dirname, '..', 'public', page, 'index.html'), 'utf8');
  const start = html.indexOf('id="' + id + '" tabindex="-1"');
  assert.notEqual(start, -1);
  return html.slice(start, html.indexOf('</article>', start));
}

test('tech support publicly distinguishes a starting diagnostic from a repair and preserves the quote round trip', () => {
  const support = card('services', 'tech-support');
  assert.match(support, /From \$49 diagnostic/);
  assert.match(support, /diagnostic to narrow down the likely cause and recommend what to try next/);
  assert.match(support, /isn’t a fixed price for the repair/);
  assert.match(support, /review the proposed work and cost before deciding/);
  assert.match(support, /href="\/contact\/#quote-support"/);

  const quote = card('contact', 'quote-support');
  assert.match(quote, /doesn’t book a diagnostic or approve a repair/);
  assert.match(quote, /href="mailto:contact@anobviousway\.com[^"]+">Open tech support draft/);
  assert.match(quote, /href="\/services\/#tech-support">See what a diagnostic covers and what it costs to start/);
  assert.ok(quote.indexOf('doesn’t book') < quote.indexOf('Open tech support draft'));
  assert.ok(quote.indexOf('Open tech support draft') < quote.indexOf('See what a diagnostic covers'));
});
