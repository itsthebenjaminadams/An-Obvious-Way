const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

const asset = file => readFileSync(join(__dirname, '../public', file), 'utf8');
const js = asset('assets/workload-estimator.js');

function fixture(clipboard = { writeText: async () => {} }) {
  const callbacks = {};
  const minutes = { valueAsNumber: 15 };
  const runs = { valueAsNumber: 4 };
  const result = { textContent: '' };
  const handoff = { hidden: true }, manual = { hidden: true }, status = { textContent: '' };
  const copy = { addEventListener: (_, fn) => { callbacks.copy = fn; } };
  const document = { querySelector: () => form, activeElement: copy };
  const summary = { value: '', selected: false,
    focus: () => { document.activeElement = summary; },
    select: () => { summary.selected = true; }
  };
  const form = {
    hidden: true, valid: true,
    addEventListener: (name, listener) => { callbacks[name] = listener; },
    checkValidity: () => form.valid,
    querySelector: key => ({
      '[data-workload-minutes]': minutes, '[data-workload-runs]': runs, '[data-workload-result]': result,
      '[data-workload-handoff]': handoff, '[data-workload-copy]': copy, '[data-workload-manual]': manual,
      '[data-workload-summary]': summary, '[data-workload-copy-status]': status
    })[key]
  };
  runInNewContext(js, { document, navigator: { clipboard } });
  return { document, handoff, manual, status, summary, copy: () => callbacks.copy(), form, minutes, runs, result, edit: () => callbacks.input(), submit: () => {
    let stopped = false;
    callbacks.submit({ preventDefault: () => { stopped = true; } });
    assert.ok(stopped);
  } };
}

test('estimates current workload in exact hours and minutes, or minutes alone', () => {
  const f = fixture();
  assert.equal(f.form.hidden, false);
  f.submit();
  assert.equal(f.result.textContent, '1 hour per week. 4 hours over four weeks.');
  f.minutes.valueAsNumber = 61;
  f.runs.valueAsNumber = 1;
  f.edit();
  assert.equal(f.result.textContent, '');
  f.submit();
  assert.equal(f.result.textContent, '1 hour 1 minute per week. 4 hours 4 minutes over four weeks.');
  f.minutes.valueAsNumber = 1;
  f.submit();
  assert.equal(f.result.textContent, '1 minute per week. 4 minutes over four weeks.');
});

test('does not return stale results for invalid entries or estimates over one person-week', () => {
  const f = fixture();
  f.submit();
  f.edit();
  f.form.valid = false;
  f.submit();
  assert.equal(f.result.textContent, '');
  f.form.valid = true;
  f.minutes.valueAsNumber = 1440;
  f.runs.valueAsNumber = 7;
  f.submit();
  assert.match(f.result.textContent, /^168 hours per week/);
  f.runs.valueAsNumber = 8;
  f.submit();
  assert.match(f.result.textContent, /more than 168 hours/);
});

test('service page offers a manual example and calculator without sending inputs', () => {
  const html = asset('services/index.html');
  assert.match(html, /href="#workflow-time"/);
  assert.match(html, /15 minutes × 4 runs/);
  assert.match(html, /not savings/);
  const form = html.match(/<form[^>]+data-workload hidden>[\s\S]+?<\/form>/)[0];
  assert.doesNotMatch(form, /\s(?:action|name)=/);
  assert.match(form, /role="status"/);
  assert.match(form, /type="button" data-workload-copy/);
  assert.match(form, /<textarea[^>]+data-workload-summary[^>]+readonly/);
  assert.match(html, /href="\/contact\/#quote-automation">Discuss this workflow/);
  const inputs = [...form.matchAll(/<input[^>]*>/g)].map(m => m[0]);
  assert.equal(inputs.length, 2);
  for (const input of inputs) assert.match(input, /type="number"[^>]*min="1"[^>]*step="1" required/);
});

test('copies only an explicit, valid workload summary and clears it on edit', async () => {
  const writes = [];
  const f = fixture({ writeText: async text => { writes.push(text); } });
  assert.equal(f.handoff.hidden, true);
  await f.copy();
  assert.equal(writes.length, 0);
  f.submit();
  assert.equal(f.handoff.hidden, false);
  assert.equal(writes.length, 0);
  await f.copy();
  assert.deepEqual(writes, ['Current workload for one person: 15 minutes per run, 4 runs per week (1 hour per week). Estimate of time spent today, not savings.']);
  assert.match(f.status.textContent, /Workload summary copied/);
  f.edit();
  assert.equal(f.handoff.hidden, true);
  assert.equal(f.summary.value, '');
  assert.equal(f.status.textContent, '');
  await f.copy();
  assert.equal(writes.length, 1);
  f.minutes.valueAsNumber = 1440;
  f.runs.valueAsNumber = 8;
  f.submit();
  assert.equal(f.handoff.hidden, true);
});

test('clipboard failure exposes selectable text, and a stale failure cannot restore it', async () => {
  let reject;
  const f = fixture({ writeText: () => new Promise((_, fail) => { reject = fail; }) });
  f.submit();
  let pending = f.copy();
  reject(new Error('Clipboard unavailable'));
  await pending;
  assert.equal(f.manual.hidden, false);
  assert.equal(f.document.activeElement, f.summary);
  assert.equal(f.summary.selected, true);
  assert.match(f.status.textContent, /Copy the selected workload summary/);
  f.edit();
  f.submit();
  pending = f.copy();
  f.edit();
  reject(new Error('Stale'));
  await pending;
  assert.equal(f.manual.hidden, true);
  assert.equal(f.summary.value, '');
  assert.equal(f.status.textContent, '');
});
