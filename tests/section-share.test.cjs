const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const read = file => readFileSync(join(__dirname, '..', 'public', file), 'utf8');
const script = read('assets/section-share.js');
function simulate(page, id, writeText, { validTarget = true } = {}) {
  const status = { textContent: '' }, fallback = { hidden: true };
  const button = { addEventListener(type, handler) { this[type] = handler; } };
  const field = {
    readOnly: true,
    focus() { document.activeElement = field; },
    select() { this.selected = true; }
  };
  const parts = {
    copy: button, status, fallback, url: field
  };
  const widget = {
    hidden: true,
    dataset: { sectionShare: id },
    querySelector(s) { return parts[s.slice(20,-1)]; }
  };
  const document = {
    activeElement: button,
    getElementById: s => validTarget && s === id ? {} : null,
    querySelector: () => ({ href: page }),
    querySelectorAll: () => [widget]
  };
  vm.runInNewContext(script, { document, navigator: { clipboard: { writeText } }, URL });
  return { button, status, fallback, field, widget, document };
}
test('each offer and walkthrough use a unique live deep link and hidden-without-JS control', () => {
  for (const [path, ids] of [
    ['services', ['tech-support', 'web-development', 'workflow-automation']],
    ['portfolio', ['live-quote-proof']]
  ]) {
    const html = read(path + '/index.html');
    assert.match(html, new RegExp('<link rel="canonical" href="https://anobviousway\\.com/' + path + '/">'));
    assert.deepEqual([...html.matchAll(/data-section-share="([^"]+)" hidden/g)].map(m => m[1]), ids);
    for (const id of ids) {
      assert.match(html, new RegExp('id="' + id + '" tabindex="-1"'));
      assert.match(html, new RegExp('for="share-' + id + '-url">'));
      assert.match(html, new RegExp('id="share-' + id + '-url" type="url" readonly'));
    }
  }
});
test('only explicit copy requests write the production link and keep focus on success', async () => {
  const writes = [];
  const x = simulate('https://anobviousway.com/services/', 'tech-support', async value => writes.push(value));
  assert.equal(x.widget.hidden, false);
  assert.deepEqual(writes, []);
  await x.button.click();
  assert.deepEqual(writes, ['https://anobviousway.com/services/#tech-support']);
  assert.equal(x.status.textContent, 'Link copied.');
  assert.equal(x.document.activeElement, x.button);
  assert.equal(x.fallback.hidden, true);
});
test('clipboard denial shows a selectable URL without stealing moved focus', async () => {
  let deny;
  const x = simulate('https://anobviousway.com/portfolio/', 'live-quote-proof',
    () => new Promise((_, reject) => { deny = reject; }));
  let pending = x.button.click();
  deny(new Error('unavailable'));
  await pending;
  assert.equal(x.field.value, 'https://anobviousway.com/portfolio/#live-quote-proof');
  assert.equal(x.fallback.hidden, false);
  assert.equal(x.document.activeElement, x.field);
  assert.equal(x.field.selected, true);
  x.document.activeElement = x.button;
  pending = x.button.click();
  const other = {};
  x.document.activeElement = other;
  deny(new Error('unavailable'));
  await pending;
  assert.equal(x.document.activeElement, other);
  assert.equal(x.status.textContent, 'Select and copy the link below.');
});
test('does not expose share actions for a missing target or unexpected canonical origin', () => {
  for (const x of [
    simulate('https://preview.example/services/', 'tech-support', () => assert.fail()),
    simulate('https://anobviousway.com/services/', 'tech-support', () => assert.fail(), { validTarget: false })
  ]) assert.equal(x.widget.hidden, true);
});
