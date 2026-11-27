const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const fromPublic = p => fs.readFileSync(path.join(__dirname, '../public', p), 'utf8');

test('native shortcuts and return links connect all four focusable quote choices', () => {
  const html = fromPublic('contact/index.html');
  const nav = html.match(/<nav class="service-chooser" aria-label="Jump to a quote template">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav);
  assert.ok(nav.includes('href="#quote-general">Not sure yet</a>'));
  const cards = Array.from(html.matchAll(/<article class="quote-topic card" id="quote-([a-z]+)" tabindex="-1">([\s\S]*?)<\/article>/g));
  assert.deepEqual(cards.map(card => card[1]), ['general', 'support', 'web', 'automation']);
  for (const [, , card] of cards) {
    assert.match(card, /<\/details>[\s\S]*?<a class="text-link quote-return" href="#quote-choices">Choose another template<\/a>/);
  }
  for (const [id, label] of [['support', 'Tech support'], ['web', 'Web development'], ['automation', 'Workflow automation']]) {
    assert.ok(nav.includes(`href="#quote-${id}">${label}</a>`));
    assert.ok(html.includes(`id="quote-${id}" tabindex="-1">\n  <h3>${label}</h3>`));
  }
});

for (const moved of [false, true]) {
  test(`address manual copy preserves intent when focus ${moved ? 'moves' : 'stays'}`, async () => {
    const button = {addEventListener(type, click) {this.click = click;}};
    const doc = {activeElement: button, querySelectorAll: () => [], querySelector: () => ({querySelector: k => selectors[k]})};
    const input = {focus() {doc.activeElement = this;}, select() {this.selected = true;}};
    const fallback = {hidden:true}, status = {};
    const selectors = {'[data-address-link]':{textContent:'contact@example.test'},'[data-address-copy]':button,'[data-address-fallback]':fallback,'[data-address-text]':input,'[data-address-status]':status};
    let reject;
    const writeText = () => new Promise((pass, fail) => {reject = fail;});
    doc.addEventListener = () => {};
    vm.runInNewContext(fromPublic('assets/contact-affordances.js'), {document:doc,window:{location:{hash:''},addEventListener(){}},navigator:{clipboard:{writeText}}});
    const pending = button.click(), next = {};
    if (moved) doc.activeElement = next;
    reject(new Error('unavailable'));
    await pending;
    assert.equal(fallback.hidden, false);
    assert.equal(input.value, 'contact@example.test');
    assert.equal(doc.activeElement, moved ? next : input);
    assert.equal(Boolean(input.selected), !moved);
    assert.match(status.textContent, moved ? /available to select/ : /selected email address/);
  });
}
