const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const page = name => readFileSync(join(__dirname, '../public', name, 'index.html'), 'utf8');
test('customers can go from Services to project handoff guidance to the real case study without a script', () => {
  assert.match(page('services'), /<a class="text-link" href="\/about\/#how-we-work">See how we scope and hand off a project/);
  const about = page('about');
  assert.match(about, /<h2 id="how-we-work">/);
  const handoff = about.match(/<details>\s*<summary><strong>Understand the handoff\.<\/strong>[\s\S]*?<\/details>/)?.[0];
  assert.ok(handoff, 'Handoff stays a native disclosure');
  assert.match(handoff, /<h3>Know how to check the result<\/h3>/);
  assert.match(handoff, /<a class="text-link" href="\/portfolio\/#live-quote-proof">Try a real website check/);
  assert.match(page('portfolio'), /id="live-quote-proof"/);
});
