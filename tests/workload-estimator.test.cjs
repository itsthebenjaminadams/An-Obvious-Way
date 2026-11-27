const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

const asset = file => readFileSync(join(__dirname, '../public', file), 'utf8');
const js = asset('assets/workload-estimator.js');

function fixture() {
  const callbacks = {};
  const minutes = { valueAsNumber: 15 };
  const runs = { valueAsNumber: 4 };
  const result = { textContent: '' };
  const form = {
    hidden: true, valid: true,
    addEventListener: (name, listener) => { callbacks[name] = listener; },
    checkValidity: () => form.valid,
    querySelector: key => ({
      '[data-workload-minutes]': minutes, '[data-workload-runs]': runs, '[data-workload-result]': result
    })[key]
  };
  runInNewContext(js, { document: { querySelector: () => form } });
  return { form, minutes, runs, result, edit: () => callbacks.input(), submit: () => {
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
  const inputs = [...form.matchAll(/<input[^>]*>/g)].map(m => m[0]);
  assert.equal(inputs.length, 2);
  for (const input of inputs) assert.match(input, /type="number"[^>]*min="1"[^>]*step="1" required/);
});
