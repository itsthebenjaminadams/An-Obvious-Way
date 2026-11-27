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

  // Export only the cleaned rows of the last completed run, never the raw table.
  function reportCsv(rows) {
    const quote = value => '"' + value.replace(/"/g, '""') + '"';
    // Spreadsheet apps may interpret a leading formula marker even in a quoted CSV cell.
    const safeText = value => /^[=+@-]/.test(value) ? "'" + value : value;
    const lines = rows.map(([job, owner, hours, status]) =>
      [safeText(job), safeText(owner), hours, safeText(status)].map(quote).join(','));
    return ['Job,Owner,Hours,Status', ...lines].join('\r\n') + '\r\n';
  }

  const demo = document.querySelector('[data-report-demo]');
  if (!demo) return;
  const get = selector => demo.querySelector('[data-report-' + selector + ']');
  const input = get('input');
  const controls = get('controls');
  const run = get('run');
  const reset = get('reset');
  const result = get('result');
  const download = get('download');
  const status = get('status');
  const cleaned = get('cleaned');
  const flags = get('flags');
  const acceptedCount = get('accepted');
  const flaggedCount = get('flagged');
  const hours = get('hours');
  const byStatus = get('by-status');
  const repairPanel = get('repair-panel');
  const repairMeter = get('repair-meter');
  const repairCount = get('repair-count');
  const repairApply = get('repair-apply');
  const clearMessage = get('clear');
  const repairs = Array.from(demo.querySelectorAll('[data-report-repair]'));
  const repairColumns = { owner: 1, hours: 2, status: 3 };
  const repairJobs = new Set(repairs.map(select => select.dataset.job));
  if (![input, controls, run, reset, result, status, cleaned, flags, acceptedCount, flaggedCount, hours, byStatus, repairPanel, repairMeter, repairCount, repairApply, clearMessage].every(Boolean) || !repairJobs.size) return;

  function makeText(tag, text) {
    const el = document.createElement(tag);
    el.textContent = text;
    return el;
  }

  function runReport() {
    const rows = Array.from(input.rows, row => Array.from(row.cells, cell => cell.textContent));
    const byJob = new Map(rows.map(row => [cleanText(row[0]), row]));
    for (const selection of repairs) {
      const row = byJob.get(selection.dataset.job);
      const column = repairColumns[selection.dataset.reportRepair];
      if (row && Number.isInteger(column) && selection.value !== '') row[column] = selection.value;
    }
    const summary = summarize(rows);
    const repaired = summary.accepted.filter(([job]) => repairJobs.has(job)).length;
    const completed = repaired === repairJobs.size;
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
    flags.hidden = summary.flagged.length === 0;
    clearMessage.hidden = summary.flagged.length !== 0;
    repairMeter.max = repairJobs.size;
    repairMeter.value = repaired;
    repairCount.textContent = repaired + ' of ' + repairJobs.size + ' repaired';
    repairPanel.dataset.cleared = String(completed);
    repairPanel.hidden = false;
    if (download) {
      download.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(reportCsv(summary.accepted));
    }
    result.hidden = false;
    reset.disabled = false;
    status.textContent = 'Report ready: ' + summary.accepted.length + ' included, ' + summary.flagged.length + ' flagged, ' + summary.hours + ' total hours. ' + repaired + ' of ' + repairJobs.size + ' challenge rows repaired.';
  }
  run.addEventListener('click', runReport);
  repairApply.addEventListener('click', runReport);

  repairs.forEach(selection => {
    selection.addEventListener('change', () => {
      status.textContent = 'Choices changed. Rerun the report to check the selected fixes.';
    });
  });

  reset.addEventListener('click', () => {
    result.hidden = true;
    download?.removeAttribute('href');
    repairPanel.hidden = true;
    repairPanel.dataset.cleared = 'false';
    repairs.forEach(selection => { selection.selectedIndex = 0; });
    repairMeter.value = 0;
    repairCount.textContent = '0 of ' + repairJobs.size + ' repaired';
    clearMessage.hidden = true;
    cleaned.replaceChildren();
    flags.replaceChildren();
    run.focus();
    reset.disabled = true;
    status.textContent = 'Demo reset. The original sample rows are unchanged.';
  });

  controls.hidden = false;
})();
