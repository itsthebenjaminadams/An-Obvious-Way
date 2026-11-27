(() => {
  'use strict';

  const form = document.querySelector('[data-workload]');
  const minutes = form?.querySelector('[data-workload-minutes]');
  const runs = form?.querySelector('[data-workload-runs]');
  const result = form?.querySelector('[data-workload-result]');
  const handoff = form?.querySelector('[data-workload-handoff]');
  const copy = form?.querySelector('[data-workload-copy]');
  const manual = form?.querySelector('[data-workload-manual]');
  const summary = form?.querySelector('[data-workload-summary]');
  const status = form?.querySelector('[data-workload-copy-status]');
  if (!minutes || !runs || !result) return;
  const canShare = handoff && copy && manual && summary && status;
  let copyOperation = 0;

  function resetSummary() {
    if (!canShare) return;
    copyOperation++;
    handoff.hidden = true;
    manual.hidden = true;
    summary.value = '';
    status.textContent = '';
  }

  function duration(total) {
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    const parts = [];
    if (hours) parts.push(`${hours.toLocaleString('en-US')} ${hours === 1 ? 'hour' : 'hours'}`);
    if (rest) parts.push(`${rest} ${rest === 1 ? 'minute' : 'minutes'}`);
    return parts.join(' ');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    resetSummary();
    if (!form.checkValidity()) { result.textContent = ''; return; }
    const weekly = minutes.valueAsNumber * runs.valueAsNumber;
    if (weekly > 7 * 24 * 60) {
      result.textContent = 'That adds up to more than 168 hours in a week. Check the minutes and runs for one person.';
      return;
    }
    result.textContent = `${duration(weekly)} per week. ${duration(weekly * 4)} over four weeks.`;
    if (canShare) {
      const count = runs.valueAsNumber;
      summary.value = `Current workload for one person: ${duration(minutes.valueAsNumber)} per run, ${count.toLocaleString('en-US')} ${count === 1 ? 'run' : 'runs'} per week (${duration(weekly)} per week). Estimate of time spent today, not savings.`;
      handoff.hidden = false;
    }
  });
  form.addEventListener('input', () => {
    result.textContent = '';
    resetSummary();
  });
  if (canShare) copy.addEventListener('click', async () => {
    if (handoff.hidden || !summary.value) return;
    const operation = ++copyOperation;
    const originalFocus = document.activeElement;
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(summary.value);
      if (operation !== copyOperation) return;
      if (document.activeElement !== summary) manual.hidden = true;
      status.textContent = 'Workload summary copied. Paste it into your quote email.';
    } catch {
      if (operation !== copyOperation) return;
      manual.hidden = false;
      if (document.activeElement === originalFocus && originalFocus === copy) {
        summary.focus();
        summary.select();
        status.textContent = 'Automatic copy is unavailable. Copy the selected workload summary.';
      } else {
        status.textContent = 'Automatic copy is unavailable. Select and copy the workload summary above.';
      }
    }
  });
  form.hidden = false;
})();
