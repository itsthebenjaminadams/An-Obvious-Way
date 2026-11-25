(() => {
  'use strict';

  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;
  dialog.className = 'window-reading-mode';

  const panels = [];
  let expanded;

  function makeButton(action, name, glyph, visibleText) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'window-panel-button window-panel-' + action;
    if (visibleText) {
      button.textContent = visibleText;
    } else {
      const mark = document.createElement('span');
      mark.textContent = glyph;
      mark.setAttribute('aria-hidden', 'true');
      button.append(mark);
    }
    label(button, name);
    return button;
  }

  function label(button, name) {
    button.setAttribute('aria-label', name);
    button.title = name;
  }

  function setState(item, state) {
    const { panel, content, group, minimize, reopen, name } = item;
    panel.dataset.windowState = state;
    const collapsed = state !== 'open';
    content.hidden = collapsed;
    group.hidden = state === 'closed';
    reopen.hidden = state !== 'closed';
    minimize.setAttribute('aria-expanded', String(!collapsed));
    label(minimize, (collapsed ? 'Restore ' : 'Minimize ') + name);
    minimize.firstElementChild.textContent = collapsed ? '+' : '−';
  }

  function expand(item) {
    if (expanded || dialog.open) return;
    const previousState = item.panel.dataset.windowState;
    const spacer = document.createElement('div');
    spacer.className = 'window-panel-spacer';
    spacer.style.blockSize = item.panel.getBoundingClientRect().height + 'px';
    spacer.setAttribute('aria-hidden', 'true');
    item.panel.before(spacer);
    setState(item, 'open');
    dialog.setAttribute('aria-label', item.name + ' reading mode');
    item.panel.dataset.windowExpanded = '';
    expanded = { item, spacer, previousState };
    dialog.append(item.panel);
    item.group.hidden = true;
    item.exit.hidden = false;
    try {
      dialog.showModal();
    } catch {
      leaveReadingMode();
      return;
    }
    document.documentElement.classList.add('aow-reading-open');
    dialog.scrollTop = 0;
    item.exit.focus({ preventScroll: true });
  }

  function leaveReadingMode(restoreFocus = true) {
    if (!expanded) return;
    const { item, spacer, previousState } = expanded;
    expanded = undefined;
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('aow-reading-open');
    spacer.replaceWith(item.panel);
    delete item.panel.dataset.windowExpanded;
    item.exit.hidden = true;
    setState(item, previousState);
    if (restoreFocus) item.maximize.focus({ preventScroll: true });
  }

  function restoreHash(hash) {
    if (!hash || hash === '#') return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    const item = panels.find(({ panel }) => panel.contains(target) || panel.closest('details')?.querySelector('summary') === target);
    if (item && item.content.hidden) {
      setState(item, 'open');
      return target;
    }
  }

  document.querySelectorAll('[data-window-panel]').forEach((panel, index) => {
    const head = panel.querySelector(':scope > .window-head');
    const content = panel.querySelector(':scope > .window-body');
    const lights = head?.querySelector('.lights');
    const name = panel.dataset.windowPanel;
    if (!head || !content || !lights || !name) return;

    const group = document.createElement('div');
    group.className = 'window-panel-controls';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', name + ' controls');
    const close = makeButton('close', 'Close ' + name, '×');
    const minimize = makeButton('minimize', 'Minimize ' + name, '−');
    const maximize = makeButton('expand', 'Expand ' + name, '□');
    const reopen = makeButton('reopen', 'Reopen ' + name, '', 'Reopen');
    const exit = makeButton('exit', 'Exit reading mode for ' + name, '', 'Exit reading mode');
    content.id ||= 'aow-panel-content-' + (index + 1);
    for (const button of [close, minimize, maximize, reopen]) button.setAttribute('aria-controls', content.id);
    maximize.setAttribute('aria-haspopup', 'dialog');
    group.append(close, minimize, maximize);
    lights.replaceWith(group, reopen);
    head.append(exit);
    exit.hidden = true;
    const item = { panel, content, group, minimize, maximize, reopen, exit, name };
    panels.push(item);
    setState(item, 'open');

    close.addEventListener('click', () => { setState(item, 'closed'); reopen.focus(); });
    reopen.addEventListener('click', () => { setState(item, 'open'); close.focus(); });
    minimize.addEventListener('click', () => {
      setState(item, content.hidden ? 'open' : 'minimized');
      minimize.focus();
    });
    maximize.addEventListener('click', () => expand(item));
    exit.addEventListener('click', () => leaveReadingMode());
  });

  if (!panels.length) return;
  document.body.append(dialog);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    leaveReadingMode();
  });
  dialog.addEventListener('close', () => { if (!dialog.open) leaveReadingMode(); });
  // While this modal is open, Escape is only an exit, not a global boot skip.
  document.addEventListener('keydown', event => {
    if (!expanded || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    leaveReadingMode();
  }, true);
  function revealLocationTarget() {
    if (expanded) leaveReadingMode(false);
    restoreHash(location.hash)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  window.addEventListener('hashchange', revealLocationTarget);
  // A cached history entry already has the visitor's panel and scroll state.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    if (expanded) leaveReadingMode(false);
    if (url.hash === location.hash) {
      const target = restoreHash(url.hash);
      if (!target) return;
      if (target.tagName === 'SUMMARY' || target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  });
})();
