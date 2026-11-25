(() => {
  'use strict';

  const channels = [
    ['01 / Tech support: Start with what changed and when it broke.', 'Explore tech support', '/services/#tech-support'],
    ['02 / Web development: Start with what visitors should be able to do.', 'Explore web development', '/services/#web-development'],
    ['03 / Workflow automation: Start with the steps you keep repeating.', 'Explore workflow automation', '/services/#workflow-automation']
  ];
  const tuner = document.querySelector('[data-mission-tuner]');
  if (tuner) {
    const buttons = [...tuner.querySelectorAll('button[data-tune]')];
    const signal = tuner.querySelector('[data-mission-signal]');
    const link = tuner.querySelector('[data-mission-link]');
    const station = tuner.closest('[data-cinematic-console]');
    function tune(index) {
      if (!channels[index]) return;
      const [message, title, href] = channels[index];
      if (signal.textContent !== message) signal.textContent = message;
      link.href = href;
      link.firstChild.nodeValue = title + ' ';
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      if (station) station.dataset.tuned = String(index);
    }
    buttons.forEach(button => button.addEventListener('click', () => tune(Number(button.dataset.tune))));
    tune(0);
    tuner.hidden = false;
  }

  const diagnostic = document.querySelector('[data-finder-signal]');
  if (diagnostic) {
    const choices = [...document.querySelectorAll('.finder-list details')];
    const status = diagnostic.querySelector('[data-finder-status]');
    const match = ['Tech support', 'Web development', 'Workflow automation', 'General inquiry'];
    let current;
    function update() {
      const selected = choices.findIndex(choice => choice.open);
      if (selected === current) return;
      current = selected;
      status.textContent = selected < 0 ? '' : selected === 3 ? 'You can start without choosing a service.' : 'Suggested starting point: ' + match[selected];
    }
    // Comparing services is navigation, not a reset of the visitor's choice.
    choices.forEach(choice => choice.addEventListener('toggle', update));
    update();
    status.hidden = false;
  }

  const viewer = document.querySelector('[data-process-controls]');
  const stepList = document.querySelector('[data-process-steps]');
  if (viewer && stepList) {
    const steps = [...stepList.querySelectorAll('article')];
    const status = viewer.querySelector('[data-process-status]');
    const all = viewer.querySelector('[data-process-all]');
    if (steps.length) {
      let step = 0;
      let showAll = false;
      function render() {
        steps.forEach((card, i) => { card.hidden = !showAll && i !== step; });
        stepList.classList.toggle('process-single', !showAll);
        all.setAttribute('aria-pressed', String(showAll));
        status.textContent = showAll ? 'Showing all ' + steps.length + ' steps' :
          'Step ' + (step + 1) + ' of ' + steps.length + ' / ' + steps[step].querySelector('h3').textContent;
      }
      function move(direction) {
        showAll = false;
        step = (step + direction + steps.length) % steps.length;
        render();
      }
      viewer.querySelector('[data-process-prev]').addEventListener('click', () => move(-1));
      viewer.querySelector('[data-process-next]').addEventListener('click', () => move(1));
      all.addEventListener('click', () => { showAll = !showAll; render(); });
      render();
      viewer.hidden = false;
    }
  }

  const checklist = document.querySelector('[data-quote-preflight]');
  if (checklist) {
    const items = [...checklist.querySelectorAll('input[type="checkbox"]')];
    const status = checklist.querySelector('[data-preflight-status]');
    function update() {
      const n = items.filter(item => item.checked).length;
      status.textContent = n + ' of ' + items.length + ' checked · ' +
        (n === items.length ? 'Ready for your email draft.' : 'Send whenever you’re ready.');
    }
    checklist.addEventListener('change', update);
    window.addEventListener('pageshow', update);
    update();
    checklist.hidden = false;
  }
})();
