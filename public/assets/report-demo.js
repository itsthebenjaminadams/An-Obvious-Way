(() => {
  'use strict';

  // Treat the visible, fictional HTML table as the demo's sole data source.
  const statuses = new Map([['done', 'Done'], ['in progress', 'In progress']]);
  const cleanText = value => value.trim().replace(/\s+/g, ' ');

  function summarize(rows) {
    const accepted = [];
    const flagged = [];
    let hundredths = 0;
    let done = 0;
    let inProgress = 0;
    for (const [rawJob, rawOwner, rawHours, rawStatus] of rows) {
      const job = cleanText(rawJob);
      const owner = cleanText(rawOwner);
      const hours = cleanText(rawHours);
      const status = statuses.get(cleanText(rawStatus).toLowerCase());
      const validHours = /^\d+(?:\.\d{1,2})?$/.test(hours) && Number.isFinite(Number(hours));
      const problems = [];
      if (!job) problems.push('missing job');
      if (!owner) problems.push('missing owner');
      if (!validHours) problems.push('hours must be a non-negative number with at most two decimal places');
      if (!status) problems.push('status must be “Done” or “In progress”');
      if (problems.length) {
        flagged.push({ job: job || 'Unnamed job', problems });
        continue;
      }
      const hoursHundredths = Math.round(Number(hours) * 100);
      accepted.push([job, owner, (hoursHundredths / 100).toFixed(2), status]);
      hundredths += hoursHundredths;
      if (status === 'Done') done += 1;
      else inProgress += 1;
    }
    return { accepted, flagged, hours: (hundredths / 100).toFixed(2), done, inProgress };
  }

  const demo = document.querySelector('[data-report-demo]');
  if (!demo) return;
  const get = selector => demo.querySelector('[data-report-' + selector + ']');
  const input = get('input');
  const controls = get('controls');
  const run = get('run');
  const reset = get('reset');
  const result = get('result');
  const status = get('status');
  const cleaned = get('cleaned');
  const flags = get('flags');
  const acceptedCount = get('accepted');
  const flaggedCount = get('flagged');
  const hours = get('hours');
  const byStatus = get('by-status');
  if (![input, controls, run, reset, result, status, cleaned, flags, acceptedCount, flaggedCount, hours, byStatus].every(Boolean)) return;

  function makeText(tag, text) {
    const el = document.createElement(tag);
    el.textContent = text;
    return el;
  }

  run.addEventListener('click', () => {
    const rows = Array.from(input.rows, row => Array.from(row.cells, cell => cell.textContent));
    const summary = summarize(rows);
    const cleanRows = summary.accepted.map(([job, owner, hours, status]) => {
      const row = document.createElement('tr');
      const title = makeText('th', job);
      title.scope = 'row';
      row.append(title, makeText('td', owner), makeText('td', hours), makeText('td', status));
      return row;
    });
    cleaned.replaceChildren(...cleanRows);
    flags.replaceChildren(...summary.flagged.map(({ job, problems }) => makeText('li', job + ': ' + problems.join('; ') + '.')));
    acceptedCount.textContent = summary.accepted.length;
    flaggedCount.textContent = summary.flagged.length;
    hours.textContent = summary.hours;
    byStatus.textContent = summary.done + ' done · ' + summary.inProgress + ' in progress';
    result.hidden = false;
    reset.disabled = false;
    status.textContent = 'Report ready: ' + summary.accepted.length + ' included, ' + summary.flagged.length + ' flagged, ' + summary.hours + ' total hours.';
  });

  reset.addEventListener('click', () => {
    result.hidden = true;
    cleaned.replaceChildren();
    flags.replaceChildren();
    run.focus();
    reset.disabled = true;
    status.textContent = 'Demo reset. The original sample rows are unchanged.';
  });

  controls.hidden = false;
})();
