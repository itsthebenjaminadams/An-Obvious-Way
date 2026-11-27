(() => {
  'use strict';

  const form = document.querySelector('[data-workload]');
  const minutes = form?.querySelector('[data-workload-minutes]');
  const runs = form?.querySelector('[data-workload-runs]');
  const result = form?.querySelector('[data-workload-result]');
  if (!minutes || !runs || !result) return;

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
    if (!form.checkValidity()) return;
    const weekly = minutes.valueAsNumber * runs.valueAsNumber;
    if (weekly > 7 * 24 * 60) {
      result.textContent = 'That adds up to more than 168 hours in a week. Check the minutes and runs for one person.';
      return;
    }
    result.textContent = `${duration(weekly)} per week. ${duration(weekly * 4)} over four weeks.`;
  });
  form.addEventListener('input', () => { result.textContent = ''; });
  form.hidden = false;
})();
