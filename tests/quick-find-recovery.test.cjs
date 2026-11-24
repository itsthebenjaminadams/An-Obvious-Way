'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let active;
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.events = {}; this.attributes = {}; this.hidden = false; }
  setAttribute(key, value) { this.attributes[key] = value; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(key, listener) { this.events[key] = listener; }
  focus() { active = this; }
  showModal() { this.open = true; }
  close() { this.open = false; this.events.close(); }
  closest(selector) { return selector === 'a[href]' && this.tag === 'a' ? this : null; }
}
const opener = new Element('button');
const document = {querySelector: () => opener, createElement: tag => new Element(tag), body: new Element('body')};
const code = fs.readFileSync(path.join(__dirname, '../public/assets/quick-find.js'), 'utf8');
vm.runInNewContext(code, {document});
const [dialog] = document.body.children;
const [header, , input, , status, hits, empty, recovery] = dialog.children;
const open = () => opener.events.click();
const type = value => { input.value = value; input.events.input(); };
const click = (target, options = {}) => recovery.events.click({button: 0, target, ...options});
open();
assert.equal(active, input);
assert(recovery.hidden);
type('and the');
assert(recovery.hidden);
assert.equal(status.textContent, 'Enter a topic to search');
type('website quote');
assert(recovery.hidden);
assert.equal(hits.children[0].children[0].href, '/contact/#quote-web');
type('unrelated fictitious need');
assert(!recovery.hidden && hits.hidden && !empty.hidden);
assert.equal(status.textContent, 'No matches');
const links = recovery.children.map(li => li.children[0]);
assert.deepEqual(links.map(link => [link.textContent, link.href]), [
  ['Compare all services', '/services/#all-services'],
  ['Describe your project', '/contact/#quote-general']
]);
for (const link of links) assert.equal(link.tag, 'a');
for (const mod of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey', 'defaultPrevented']) {
  click(links[0], {[mod]: true});
  assert(dialog.open);
}
click(links[0], {button: 1}); assert(dialog.open);
click(links[0]); assert(!dialog.open && active !== opener && input.value === '');
open(); type('nonsense webpage fishing');
click(links[1]); assert(!dialog.open && active !== opener);
open(); header.children[1].events.click(); assert(!dialog.open && active === opener);
open(); dialog.close(); assert(!dialog.open && active === opener);
console.log('PASS: Quick Find recovery visibility, native static URLs, activation/modifiers, modal focus and close.');
