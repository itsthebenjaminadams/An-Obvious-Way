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
  const release = document.querySelector('[data-bios-release]');
  const biosVersion = release?.querySelector('[data-bios-version]')?.textContent.trim();
  const releasedAt = release?.querySelector('[data-bios-released]')?.getAttribute('datetime');
  if (!biosVersion || !releasedAt) return;
  const releaseUtc = releasedAt.slice(0, 16).replace('T', ' ') + ' UTC';
  const bootLines = [
    'AOW BIOS ' + biosVersion,
    'Build: ' + releaseUtc,
    'Support · Websites · Automation',
    'Ready.'
  ];
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
  setupIntro();
  setupQuoteTemplates();
});
