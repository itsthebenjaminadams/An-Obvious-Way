'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const get = name => fs.readFileSync(path.join(__dirname, '../public', name), 'utf8');

test('intro controls come before the display, and links are outside it', () => {
  const html = get('index.html');
  const control = html.indexOf('data-intro-control');
  const screen = html.indexOf('class="signal-screen"');
  const boot = html.indexOf('data-intro hidden');
  const status = html.indexOf('class="signal-status"');
  const readout = html.indexOf('data-readout');
  assert(control >= 0 && control < screen && screen < boot && boot < status && status < readout);
  assert.match(html, /<div class="signal-deck" aria-hidden="true">[\s\S]+?class="signal-status"[\s\S]+?<\/div>\s*<\/div>\s*<div class="console-content" data-console>/);
  const links = [...html.matchAll(/class="console-service" href="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(links, ['/services/#tech-support', '/services/#web-development', '/services/#workflow-automation']);
  assert.equal((html.match(/data-intro-control/g) || []).length, 1);
});

test('the themed display does not hide or intercept links during startup', () => {
  const css = get('assets/home-affordances.css');
  assert.match(css, /\.console-content\.is-playing \[data-readout\]\s*\{\s*opacity:\s*1/);
  assert.match(css, /\.console-service\s*\{[^}]*min-block-size:\s*44px/);
  assert.doesNotMatch(css, /pointer-events:\s*none|visibility:\s*hidden/);
  assert.match(css, /\.signal-screen > \.console-boot\s*\{[^}]*grid-area:\s*1 \/ 1/);
});
