const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const js = fs.readFileSync(path.join(__dirname, '../public/assets/contact-affordances.js'), 'utf8');
const names = ['Recipient address', 'Subject', 'Message'];

function fixture(writeText) {
  const fields = new Map();
  const doc = {
    activeElement: null,
    querySelector: () => null,
    querySelectorAll: () => templates,
    getElementById: id => fields.get(id)
  };
  const templates = Array.from({length: 4}, (_, t) => {
    const announcement = {textContent: ''};
    const buttons = names.map(name => {
      const id = t + ':' + name;
      const field = {value: id, readOnly: true, focus() { doc.activeElement = this; }, select() { this.selected = true; }};
      fields.set(id, field);
      const feedback = {textContent: ''};
      const row = {hidden: true, querySelector: key => key === '[data-copy-feedback]' ? feedback : null};
      return {field, feedback, hidden: true, parentElement: row, dataset: {copyField: id, copyName: name}, addEventListener(event, handler) { assert.equal(event, 'click'); this.click = handler; }};
    });
    return {announcement, buttons, open: true, querySelector: key => key === '[data-copy-status]' ? announcement : null, querySelectorAll: () => buttons, contains: field => buttons.some(button => button.field === field)};
  });
  vm.runInNewContext(js, {document: doc, navigator: writeText ? {clipboard: {writeText}} : {}});
  return {doc, templates};
}

test('all four templates report success next to the latest copied field and announce it once', async () => {
  const writes = [];
  const {doc, templates} = fixture(async value => { writes.push(value); });
  for (const {announcement, buttons} of templates) {
    for (const [index, button] of buttons.entries()) {
      const name = names[index];
      doc.activeElement = button;
      assert.equal(button.hidden, false);
      assert.equal(button.parentElement.hidden, false);
      await button.click();
      assert.equal(writes.at(-1), button.field.value);
      assert.equal(doc.activeElement, button);
      assert.equal(button.feedback.textContent, 'Copied.');
      assert.equal(announcement.textContent, name + ' copied.');
      assert.equal(buttons.filter(b => b.feedback.textContent).length, 1);
    }
  }
  assert.equal(writes.length, 12);
});

test('unavailable clipboard selects the adjacent fallback and announces it', async () => {
  const {doc, templates: [template]} = fixture();
  const button = template.buttons[1];
  doc.activeElement = button;
  await button.click();
  assert.equal(doc.activeElement, button.field);
  assert.equal(button.field.selected, true);
  assert.match(button.feedback.textContent, /Copy the selected subject/);
  assert.equal(template.announcement.textContent, button.feedback.textContent);
});

test('pending rejection never takes focus back from a visitor who moved on', async () => {
  let reject;
  const {doc, templates: [template]} = fixture(() => new Promise((_, f) => { reject = f; }));
  const button = template.buttons[0];
  const next = template.buttons[1];
  doc.activeElement = button;
  const pending = button.click();
  doc.activeElement = next;
  reject(new Error('denied'));
  await pending;
  assert.equal(doc.activeElement, next);
  assert.equal(button.field.selected, undefined);
  assert.match(button.feedback.textContent, /Select and copy the recipient address above/);
});

test('slower results cannot replace newer copy feedback or move focus after collapse', async () => {
  const ops = [];
  const {doc, templates: [template]} = fixture(() => new Promise((pass, fail) => { ops.push({pass, fail}); }));
  const [first, second, third] = template.buttons;
  doc.activeElement = first;
  const p1 = first.click();
  doc.activeElement = second;
  const p2 = second.click();
  ops[1].pass();
  await p2;
  ops[0].fail(new Error('denied'));
  await p1;
  assert.equal(first.feedback.textContent, '');
  assert.equal(template.announcement.textContent, 'Subject copied.');
  assert.equal(doc.activeElement, second);
  doc.activeElement = third;
  const p3 = third.click();
  template.open = false;
  ops[2].fail(new Error('denied'));
  await p3;
  assert.equal(third.field.selected, undefined);
  assert.equal(third.feedback.textContent, '');
  assert.equal(template.announcement.textContent, '');
});
