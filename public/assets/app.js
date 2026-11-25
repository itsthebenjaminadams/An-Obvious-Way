const themes = { green: '#61e7aa', amber: '#ffc36b', cyan: '#65d9ed', purple: '#bc9bff' };

function loadPreference(storage, key, fallback = null) {
  try { return window[storage].getItem(key); } catch { return fallback; }
}

function savePreference(storage, key, value) {
  try { window[storage].setItem(key, value); } catch { /* Private browsing may block storage. */ }
}

function setupTheme() {
  const group = document.querySelector('.settings');
  if (!group) return;
  const buttons = [...group.querySelectorAll('[data-theme]')];
  let selected = 'green';
  function apply(name) {
    if (!Object.prototype.hasOwnProperty.call(themes, name)) name = 'green';
    selected = name;
    document.documentElement.style.setProperty('--accent', themes[name]);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === name)));
  }
  apply(loadPreference('localStorage', 'aow-theme'));
  buttons.forEach(button => button.addEventListener('click', () => {
    apply(button.dataset.theme);
    savePreference('localStorage', 'aow-theme', selected);
  }));
  window.addEventListener('pageshow', event => {
    if (event.persisted) apply(loadPreference('localStorage', 'aow-theme', selected));
  });
  group.hidden = false;
}

function setupMotion() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('[data-motion-switch]');
  const callbacks = [];
  let quiet = loadPreference('localStorage', 'aow-motion') === 'quiet';
  const motion = {
    get matches() { return media.matches || quiet; },
    listen(callback) { callbacks.push(callback); }
  };
  function sync() {
    document.documentElement.dataset.motion = motion.matches ? 'quiet' : 'full';
    if (button) {
      button.disabled = media.matches;
      button.setAttribute('aria-pressed', String(motion.matches));
      button.title = media.matches ? 'Motion reduced by your device setting' : 'Reduce site motion';
    }
    callbacks.forEach(callback => callback());
  }
  button?.addEventListener('click', () => {
    if (media.matches) return;
    quiet = !quiet;
    savePreference('localStorage', 'aow-motion', quiet ? 'quiet' : 'full');
    sync();
  });
  // Run before the intro's pageshow listener so it uses the current preference.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    quiet = loadPreference('localStorage', 'aow-motion', quiet ? 'quiet' : 'full') === 'quiet';
    sync();
  });
  media.addEventListener?.('change', sync);
  sync();
  return motion;
}

function setupIntro(motion) {
  const shell = document.querySelector('[data-cinematic-console]');
  const consolePanel = document.querySelector('[data-console]');
  const intro = document.querySelector('[data-intro]');
  const output = document.querySelector('[data-intro-output]');
  const bar = document.querySelector('[data-intro-bar]');
  const button = document.querySelector('[data-intro-control]');
  const signal = document.querySelector('[data-signal-status]');
  if (!shell || !consolePanel || !intro || !output || !bar || !button || !signal) return;

  const release = document.querySelector('[data-bios-release]');
  const biosVersion = release?.querySelector('[data-bios-version]')?.textContent.trim();
  const releasedAt = release?.querySelector('[data-bios-released]')?.getAttribute('datetime');
  if (!biosVersion || !releasedAt) return;
  const releaseUtc = releasedAt.slice(0, 16).replace('T', ' ') + ' UTC';
  const stages = [
    { phase: 'sync', status: 'CIRCUIT SYNC', line: 'AOW BIOS ' + biosVersion, progress: 14, hold: 340 },
    { phase: 'sync', status: 'CIRCUIT SYNC', line: 'Build: ' + releaseUtc, progress: 28, hold: 410 },
    { phase: 'scan', status: 'SIGNAL SWEEP', line: '01 / Scanning service channels…', progress: 57, hold: 1100 },
    { phase: 'lock', status: 'SIGNAL ACQUIRED', line: '02 / Three modules locked.', progress: 83, hold: 520 },
    { phase: 'lock', status: 'ARRAY READY', line: '03 / Interface ready.', progress: 100, hold: 540 }
  ];
  let timer;
  let playing = false;

  function finish() {
    if (!playing) return;
    playing = false;
    clearTimeout(timer);
    intro.hidden = true;
    consolePanel.classList.remove('is-playing');
    shell.classList.remove('is-cinematic');
    delete shell.dataset.stage;
    signal.textContent = 'ARRAY READY';
    button.textContent = 'Replay intro';
  }

  function start() {
    if (playing || motion.matches) return;
    playing = true;
    let step = 0;
    button.textContent = 'Skip intro';
    output.textContent = '';
    bar.style.width = '0%';
    intro.hidden = false;
    consolePanel.classList.add('is-playing');
    shell.classList.add('is-cinematic');
    function tick() {
      if (!playing) return;
      const { phase, status, line, progress, hold } = stages[step];
      shell.dataset.stage = phase;
      signal.textContent = status;
      output.textContent += (step ? '\n' : '') + line;
      bar.style.width = progress + '%';
      step += 1;
      timer = setTimeout(step === stages.length ? finish : tick, hold);
    }
    tick();
  }

  function syncMotion() {
    if (motion.matches) finish();
    button.hidden = motion.matches;
  }
  syncMotion();
  motion.listen(syncMotion);
  button.addEventListener('click', () => playing ? finish() : start());
  document.addEventListener('keydown', event => { if (event.key === 'Escape') finish(); });
  window.addEventListener('pagehide', finish);
  window.addEventListener('pageshow', event => { if (event.persisted) start(); });
  start();
}

function setupQuoteTemplates() {
  document.querySelectorAll('[data-quote-template]').forEach(template => {
    const text = template.querySelector('[data-quote-text]');
    const button = template.querySelector('[data-copy-quote]');
    const status = template.querySelector('[data-copy-status]');
    if (!text || !button || !status) return;
    button.hidden = false;
    button.addEventListener('click', async () => {
      status.textContent = '';
      try {
        await window.navigator.clipboard.writeText(text.value);
        status.textContent = 'Template copied. Paste it into your email draft.';
      } catch {
        text.focus();
        text.select();
        status.textContent = 'Automatic copy is unavailable. Copy the selected text, or select it manually.';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupIntro(setupMotion());
  setupQuoteTemplates();
});
