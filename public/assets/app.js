const themes = { green: '#61e7aa', amber: '#ffc36b', cyan: '#65d9ed', purple: '#bc9bff' };

function storedTheme() {
  try {
    return localStorage.getItem('aow-theme');
  } catch {
    return null;
  }
}

function applyTheme(name) {
  if (!Object.prototype.hasOwnProperty.call(themes, name)) name = 'green';
  document.documentElement.style.setProperty('--accent', themes[name]);
  try {
    localStorage.setItem('aow-theme', name);
  } catch {
    // Theme switching still works if this browser blocks storage.
  }
  document.querySelectorAll('[data-theme]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === name));
  });
}

function setupBoot() {
  const boot = document.querySelector('.boot');
  if (!boot) return;

  const button = boot.querySelector('button');
  const pre = boot.querySelector('pre');
  const bar = boot.querySelector('.boot-progress span');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !button || !pre || !bar) {
    boot.remove();
    return;
  }

  const lines = [
    'AOW BIOS 1.0',
    'Initializing brand interface...',
    'Loading services [OK]',
    'Loading portfolio [OK]',
    'Checking connection [OK]',
    'Welcome to An Obvious Way.'
  ];
  let index = 0;
  let timeout;
  let stopped = false;
  const onEscape = event => {
    if (event.key === 'Escape') finish();
  };
  const onMotion = event => {
    if (event.matches) finish(true);
  };

  function finish(immediately = false) {
    if (stopped) return;
    stopped = true;
    clearTimeout(timeout);
    document.removeEventListener('keydown', onEscape);
    reduced.removeEventListener?.('change', onMotion);
    const hadFocus = boot.contains(document.activeElement);
    boot.classList.add('hide');
    button.tabIndex = -1;
    if (hadFocus) document.querySelector('.top .brand')?.focus();
    boot.setAttribute('aria-hidden', 'true');
    if (immediately) boot.remove();
    else setTimeout(() => boot.remove(), 500);
  }

  function step() {
    if (index === lines.length) {
      timeout = setTimeout(finish, 450);
      return;
    }
    pre.textContent += lines[index] + '\n';
    index++;
    bar.style.width = (index / lines.length * 100) + '%';
    timeout = setTimeout(step, 240);
  }

  button.addEventListener('click', () => finish());
  document.addEventListener('keydown', onEscape);
  reduced.addEventListener?.('change', onMotion);
  boot.classList.add('is-active');
  timeout = setTimeout(step, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(storedTheme());
  document.querySelectorAll('[data-theme]').forEach(button => {
    button.addEventListener('click', () => applyTheme(button.dataset.theme));
  });
  setupBoot();
});
