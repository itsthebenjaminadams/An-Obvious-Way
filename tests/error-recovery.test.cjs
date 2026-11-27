const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const load = file => readFileSync(join(__dirname, '../public', file), 'utf8');

test('404 keeps native storefront and quote recovery independent of scripts', () => {
  const page = load('404.html');
  const contact = load('contact/index.html');
  assert.match(page, /<h1>Page not found/);
  for (const path of ['/', '/services/', '/portfolio/', '/about/', '/contact/', '/contact/#quote-choices']) {
    assert.ok(page.includes('href="' + path + '"'), path);
    assert.ok(!path.includes('#') || contact.includes('id="' + path.split('#')[1] + '"'));
  }
  assert.doesNotMatch(page, /class="lights"|http-equiv="refresh"/i);
});

test('404 search uses the same static index and its progressively enhanced trigger', () => {
  const page = load('404.html');
  const main = load('index.html');
  const script = main.match(/<script src="\/assets\/quick-find\.js\?v=\d+" defer><\/script>/)[0];
  assert.ok(page.includes(script));
  assert.match(page, /<button[^>]+data-quick-find[^>]+aria-haspopup="dialog"[^>]+aria-controls="quick-find" hidden>Search AOW<\/button>/);
  assert.doesNotMatch(page, /location\.(search|pathname|href)|<input/);
});
