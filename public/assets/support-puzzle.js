(() => {
  'use strict';

  const panel = document.querySelector('[data-support-puzzle]');
  if (!panel) return;
  const get = name => panel.querySelector('[data-support-' + name + ']');
  const controls = get('interactive');
  const select = get('case');
  const reset = get('reset');
  const progress = get('progress');
  const answers = get('answer');
  const check = get('check');
  const status = get('status');
  if (![controls, select, reset, progress, answers, check, status].every(Boolean)) return;
  const clues = [...panel.querySelectorAll('[data-support-reveal]')];
  const directions = [...panel.querySelectorAll('input[name="support-direction"]')];
  const observations = new Map([...panel.querySelectorAll('[data-support-observation]')]
    .map(node => [node.dataset.supportObservation, node]));
  if (clues.length !== 3 || directions.length !== 3 || observations.size !== 3) return;
  if (clues.some(button => !observations.has(button.dataset.supportReveal))) return;

  const cases = new Map([
    ['a', {
      results: {
        peer: 'The second device stays stable on the same Wi-Fi in the same spot.',
        near: 'The affected laptop still drops on Wi-Fi near the router.',
        wired: 'The affected laptop’s call stays stable when wired with Wi-Fi off.'
      },
      answer: 'device',
      supported: 'The laptop drops on Wi-Fi in both spots, while the second device and the laptop’s wired call stay stable. Start with the affected laptop’s Wi-Fi adapter or settings. That is not a confirmed fault.',
      lower: {
        room: 'Moving the laptop nearer the router didn’t help, and the second device handled the original spot. Coverage in that room is less supported.',
        shared: 'The second device and the affected laptop’s wired call were stable. A fault shared by both paths is less supported.'
      }
    }],
    ['b', {
      results: {
        peer: 'The second device also drops on the same Wi-Fi in the same spot.',
        near: 'The affected laptop’s call stays stable on Wi-Fi near the router.',
        wired: 'The affected laptop’s call stays stable when wired with Wi-Fi off.'
      },
      answer: 'room',
      supported: 'Two devices drop in one spot, but the laptop stays stable near the router and on wire. Investigate wireless coverage or interference in that room first. That pattern doesn’t prove which one.',
      lower: {
        device: 'A second device drops in the same spot, and the affected laptop works near the router. A laptop-only issue is less supported.',
        shared: 'The laptop’s call stays stable both near the router and on wire. The issue follows the room more than the shared connection.'
      }
    }],
    ['c', {
      results: {
        peer: 'The second device also drops on the same Wi-Fi in the same spot.',
        near: 'The affected laptop still drops on Wi-Fi near the router.',
        wired: 'The affected laptop’s call also drops when wired with Wi-Fi off.'
      },
      answer: 'shared',
      supported: 'Two devices drop, and bypassing Wi-Fi doesn’t help. Check what the paths share, such as the router, internet connection, or call service. This doesn’t prove any one of those is at fault.',
      lower: {
        device: 'The other device encounters the same fault and the laptop also drops with Wi-Fi off. A laptop Wi-Fi issue alone doesn’t explain both clues.',
        room: 'The laptop drops near the router and when wired with Wi-Fi off. Coverage in the original room doesn’t explain the wired result.'
      }
    }]
  ]);

  const shown = new Set();
  let active = cases.get('a');

  function clear() {
    active = cases.get(select.value) || cases.get('a');
    shown.clear();
    progress.textContent = '0 of 3 observations';
    answers.hidden = true;
    directions.forEach(input => { input.checked = false; });
    clues.forEach(button => {
      button.setAttribute('aria-expanded', 'false');
      button.removeAttribute('aria-disabled');
    });
    observations.forEach(observation => {
      observation.hidden = true;
      observation.textContent = '';
    });
    status.textContent = '';
    delete status.dataset.state;
  }

  clues.forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.supportReveal;
      if (shown.has(key)) return;
      shown.add(key);
      const observation = observations.get(key);
      observation.textContent = active.results[key];
      observation.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-disabled', 'true');
      progress.textContent = shown.size + ' of 3 observations';
      answers.hidden = shown.size !== 3;
      status.textContent = observation.textContent + (shown.size === 3 ? ' Choose an investigation below.' : '');
    });
  });

  check.addEventListener('click', () => {
    if (shown.size !== 3) return;
    const direction = directions.find(input => input.checked)?.value;
    if (!direction) {
      status.textContent = 'Choose an investigation first.';
      delete status.dataset.state;
      return;
    }
    const correct = direction === active.answer;
    status.dataset.state = correct ? 'supported' : 'retry';
    status.textContent = correct ? 'Best-supported direction. ' + active.supported
      : 'Try another direction. ' + (active.lower[direction] || 'Review the evidence before answering.');
  });

  select.value = 'a';
  clear();
  select.addEventListener('change', clear);
  reset.addEventListener('click', clear);
  controls.hidden = false;
})();
