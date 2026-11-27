const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const page = name => readFileSync(join(__dirname, '../public', name, 'index.html'), 'utf8');
test('customers can go from Services to project handoff guidance to the real case study without a script', () => {
  assert.match(page('services'), /<a class="text-link" href="\/about\/#handoff-check">See what a project handoff includes/);
  const about = page('about');
  assert.match(about, /<h2 id="how-we-work">/);
  const handoff = about.match(/<details>\s*<summary><strong>Understand the handoff\.<\/strong>[\s\S]*?<\/details>/)?.[0];
  assert.ok(handoff, 'Handoff stays a native disclosure');
  assert.match(handoff, /<h3 id="handoff-check" tabindex="-1">Know how to check the result<\/h3>/);
  assert.match(handoff, /<a class="text-link" href="\/portfolio\/#live-quote-proof">Try a real website check/);
  assert.match(page('portfolio'), /id="live-quote-proof"/);
});

test('the exact handoff fragment opens its disclosure without stealing focus or overriding cached history', () => {
  const { runInNewContext } = require('node:vm');
  const source = readFileSync(join(__dirname, '../public/assets/about-process.js'), 'utf8');
  assert.match(page('about'), /<script src="\/assets\/about-process\.js\?v=1" defer><\/script>/);

  const start = hash => {
    const listeners = {};
    const disclosure = { open: false };
    const window = { location: { hash }, addEventListener(name, handler) { listeners[name] = handler; } };
    const target = {
      closest: selector => selector === 'details' ? disclosure : null,
      focus: () => assert.fail('Use native fragment focus, not scripted focus'),
      scrollIntoView: () => assert.fail('Use native fragment scrolling')
    };
    const document = { getElementById: id => id === 'handoff-check' ? target : null };
    runInNewContext(source, { document, window });
    return { disclosure, window, listeners };
  };

  for (const hash of ['', '#how-we-work']) assert.equal(start(hash).disclosure.open, false);
  const current = start('#handoff-check');
  assert.equal(current.disclosure.open, true);
  current.disclosure.open = false;
  assert.deepEqual(Object.keys(current.listeners), ['hashchange']);
  current.window.location.hash = '#how-we-work';
  current.listeners.hashchange();
  assert.equal(current.disclosure.open, false);
  current.window.location.hash = '#handoff-check';
  current.listeners.hashchange();
  assert.equal(current.disclosure.open, true);
});
