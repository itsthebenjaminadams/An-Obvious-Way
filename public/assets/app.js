const themes = { green: '#61e7aa', amber: '#ffc36b', cyan: '#65d9ed', purple: '#bc9bff' };

function loadPreference(storage, key) {
  try { return window[storage].getItem(key); } catch { return null; }
}

function savePreference(storage, key, value) {
  try { window[storage].setItem(key, value); } catch { /* Private browsing may block storage. */ }
}

function setupTheme() {
  const group = document.querySelector('.settings');
  if (!group) return;
  const buttons = [...group.querySelectorAll('[data-theme]')];
  function apply(name) {
    if (!Object.prototype.hasOwnProperty.call(themes, name)) name = 'green';
    document.documentElement.style.setProperty('--accent', themes[name]);
    savePreference('localStorage', 'aow-theme', name);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === name)));
  }
  apply(loadPreference('localStorage', 'aow-theme'));
  buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.theme)));
  group.hidden = false;
}

function setupIntro() {
  const consolePanel = document.querySelector('[data-console]');
  const intro = document.querySelector('[data-intro]');
  const output = document.querySelector('[data-intro-output]');
  const bar = document.querySelector('[data-intro-bar]');
  const button = document.querySelector('[data-intro-control]');
  if (!consolePanel || !intro || !output || !bar || !button) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bootLines = [
    'AOW BIOS ' + consolePanel.dataset.biosVersion,
    'Initializing system…',
    'Support · Websites · Automation',
    'Ready.'
  ];
  const seenKey = 'aow-console-intro-v1';
  let timer;
  let playing = false;

  function finish() {
    if (!playing) return;
    playing = false;
    clearTimeout(timer);
    intro.hidden = true;
    consolePanel.classList.remove('is-playing');
    button.textContent = 'Replay intro';
  }

  function start() {
    if (playing || motion.matches) return;
    playing = true;
    let step = 0;
    savePreference('sessionStorage', seenKey, 'yes');
    button.textContent = 'Skip intro';
    output.textContent = '';
    bar.style.width = '0%';
    intro.hidden = false;
    consolePanel.classList.add('is-playing');
    function tick() {
      if (!playing) return;
      output.textContent += (step ? '\n' : '') + bootLines[step];
      step += 1;
      bar.style.width = (step / bootLines.length * 100) + '%';
      timer = setTimeout(step === bootLines.length ? finish : tick, step === bootLines.length ? 500 : 220);
    }
    tick();
  }

  function syncMotion() {
    if (motion.matches) finish();
    button.hidden = motion.matches;
  }
  syncMotion();
  motion.addEventListener?.('change', syncMotion);
  button.addEventListener('click', () => playing ? finish() : start());
  document.addEventListener('keydown', event => { if (event.key === 'Escape') finish(); });
  window.addEventListener('pagehide', finish);
  let sameSite = false;
  try { sameSite = new URL(document.referrer).origin === window.location.origin; } catch { /* No referrer. */ }
  if (!sameSite && !window.location.hash && !loadPreference('sessionStorage', seenKey)) start();
}

document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupIntro();
});
