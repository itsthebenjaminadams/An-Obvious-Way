'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '../public', f), 'utf8');
const contact = read('contact/index.html');
const services = read('services/index.html');
for (const id of ['preflight-title','after-email']) {
  const linkAt = contact.indexOf(`href="#${id}"`);
  assert.ok(linkAt >= 0 && linkAt < contact.indexOf('id="quote-general"'));
  assert.match(contact, new RegExp(`id="${id}" tabindex="-1"`));
}
assert.match(contact, /id="after-email"[\s\S]+href="#quote-choices">Back to quote choices<\/a>/);
for (const [quote, service] of [['support','tech-support'], ['web','web-development'], ['automation','workflow-automation']]) {
  const card = contact.split(`id="quote-${quote}"`)[1].split('</article>')[0];
  assert.ok(card.includes(`href="/services/#${service}"`), quote);
  assert.ok(services.includes(`id="${service}" tabindex="-1"`), service);
  assert.match(services.split(`id="${service}"`)[1].split('</article>')[0],new RegExp(`href="/contact/#quote-${quote}"`));
}
