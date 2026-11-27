'use strict';
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const page = route => readFileSync(join(__dirname, '../public', route, 'index.html'), 'utf8');
for (const [route, count] of [['', 2], ['services', 1], ['about', 1]]) {
  const generic = [...page(route).matchAll(/href="([^"]+)">Request a quote<\/a>/g)];
  assert.equal(generic.length, count, route);
  for (const link of generic) assert.equal(link[1], '/contact/#quote-choices', route);
}
for (const [service, caption] of [['support', 'tech support'], ['web', 'web development'], ['automation', 'workflow automation']]) {
  assert.ok(page('services').includes(`href="/contact/#quote-${service}">Get a quote for ${caption}`));
}
assert.ok(page('services').includes('href="/contact/#quote-general">Describe your project</a>'));
const contact = page('contact');
assert.match(contact, /<section class="section" id="quote-topics" aria-labelledby="quote-choices">/);
assert.match(contact, /<h2 id="quote-choices" tabindex="-1">Start an email draft<\/h2>\s*<p>Pick the closest match, or choose Not sure yet\.[^<]+Nothing is sent until you send it\.<\/p>\s*<nav[^>]+>\s*<a href="#quote-general">Not sure yet<\/a>/);
assert.equal([...contact.matchAll(/id="quote-choices"/g)].length, 1);
