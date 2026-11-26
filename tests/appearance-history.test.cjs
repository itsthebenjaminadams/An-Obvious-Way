'use strict';
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');

const code = readFileSync(join(__dirname, '../public/assets/app.js'), 'utf8');
function node() {
  return {
    listeners: {}, attrs: {}, dataset: {}, hidden: false, textContent: '', style: { setProperty(k, v) { this[k] = v; } },
    classList: { add() {}, remove() {} },
    addEventListener(k, action) { (this.listeners[k] ??= []).push(action); },
    emit(k, event = {}) { for (const action of this.listeners[k] ?? []) action(event); },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    getAttribute(k) { return this.attrs[k]; }
  };
}

function load({ deviceQuiet = false, storageBlocked = false } = {}) {
  const saved = {};
  const window = node(), document = node(), media = node();
  media.matches = deviceQuiet;
  window.matchMedia = () => media;
  window.localStorage = {
    getItem(k) { if (storageBlocked) throw Error('unavailable'); return saved[k] ?? null; },
    setItem(k, v) { if (storageBlocked) throw Error('unavailable'); saved[k] = v; }
  };
  const color = ['green','amber','cyan','purple'].map(theme => Object.assign(node(), { dataset: { theme } }));
  const state = node(), reason = Object.assign(node(), { id: 'motion-reason' });
  const motionSwitch = Object.assign(node(), {
    querySelector: k => k === '[data-motion-state]' ? state : reason,
    focus() { document.activeElement = this; }
  });
  const groups = {
    '.settings': Object.assign(node(), { querySelectorAll: () => color }),
    '[data-motion-switch]': motionSwitch,
    '[data-cinematic-console]': node(), '[data-console]': node(),
    '[data-intro]': node(), '[data-intro-output]': node(), '[data-intro-bar]': node(),
    '[data-intro-control]': node(), '[data-signal-status]': node(),
    '[data-bios-release]': { querySelector: k => k.includes('version') ? { textContent: '4.2' } : { getAttribute: () => '2026-11-25T07:42:00Z' } }
  };
  document.documentElement = node();
  document.querySelector = k => groups[k];
  document.querySelectorAll = () => [];
  runInNewContext(code, { window, document, setTimeout() {}, clearTimeout() {} });
  document.emit('DOMContentLoaded');
  return { window, document, media, state, reason, saved, root: document.documentElement, color, motion: groups['[data-motion-switch]'], intro: groups['[data-intro]'], control: groups['[data-intro-control]'] };
}

test('history restore syncs changes made on another page before checking intro autoplay', () => {
  const { window, saved, root, color, motion, intro, control } = load();
  assert.equal(control.textContent, 'Skip intro');
  window.emit('pagehide');
  saved['aow-theme'] = 'purple';
  saved['aow-motion'] = 'quiet';
  window.emit('pageshow', { persisted: true });
  assert.equal(root.style['--accent'], '#bc9bff');
  assert.equal(color[3].attrs['aria-pressed'], 'true');
  assert.equal(root.dataset.motion, 'quiet');
  assert.equal(motion.attrs['aria-pressed'], 'true');
  assert.equal(intro.hidden, true);
  assert.equal(control.hidden, true);
  window.emit('pagehide');
  saved['aow-theme'] = 'amber';
  saved['aow-motion'] = 'full';
  window.emit('pageshow', { persisted: true });
  assert.equal(root.style['--accent'], '#ffc36b');
  assert.equal(root.dataset.motion, 'full');
  assert.equal(intro.hidden, false);
  assert.equal(control.textContent, 'Skip intro');
});

test('blocked storage preserves in-page choices after history restore', () => {
  const { window, root, color, motion, intro } = load({ storageBlocked: true });
  color[2].emit('click');
  motion.emit('click');
  window.emit('pagehide');
  window.emit('pageshow', { persisted: true });
  assert.equal(root.style['--accent'], '#65d9ed');
  assert.equal(root.dataset.motion, 'quiet');
  assert.equal(intro.hidden, true);
});

test('device reduced motion still wins on history restore', () => {
  const { window, saved, root, control, motion } = load({ deviceQuiet: true });
  saved['aow-motion'] = 'full';
  window.emit('pagehide');
  window.emit('pageshow', { persisted: true });
  assert.equal(root.dataset.motion, 'quiet');
  assert.equal(motion.attrs['aria-disabled'], 'true');
  assert.equal(control.hidden, true);
});

test('motion switch explains a device override without replacing the local choice', () => {
  const { document, media, state, reason, saved, control, motion } = load();
  assert.equal(state.textContent, 'FX ON');
  assert.equal(reason.hidden, true);
  document.activeElement = control;
  media.matches = true;
  media.emit('change');
  assert.equal(control.hidden, true);
  assert.equal(document.activeElement, motion);
  assert.equal(state.textContent, 'FX OFF');
  assert.equal(reason.hidden, false);
  assert.equal(motion.attrs['aria-describedby'], reason.id);
  motion.emit('click');
  assert.equal(saved['aow-motion'], undefined);
  media.matches = false;
  media.emit('change');
  assert.equal(motion.attrs['aria-disabled'], 'false');
  assert.equal(motion.attrs['aria-describedby'], undefined);
  assert.equal(state.textContent, 'FX ON');
  assert.equal(reason.hidden, true);
  assert.equal(control.textContent, 'Replay intro');
  motion.emit('click');
  assert.equal(state.textContent, 'FX OFF');
  assert.equal(saved['aow-motion'], 'quiet');
  media.matches = true;
  media.emit('change');
  media.matches = false;
  media.emit('change');
  assert.equal(state.textContent, 'FX OFF');
  assert.equal(control.hidden, true);
});
