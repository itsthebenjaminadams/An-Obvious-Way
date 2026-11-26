const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const load = path => readFileSync(join(__dirname, '../public', path), 'utf8');

test('each optional lab has matching service scope and direct quote links', () => {
  const portfolio = load('portfolio/index.html');
  const services = load('services/index.html');
  const contact = load('contact/index.html');
  const parts = portfolio.split('<details class="portfolio-lab" data-portfolio-lab>');
  assert.equal(parts.length, 3);
  for (const [i, service, topic] of [[1, 'tech-support', 'support'], [2, 'workflow-automation', 'automation']]) {
    const lab = parts[i].split('</article>')[0];
    const path = lab.split('class="portfolio-lab-next"')[1];
    assert.ok(path);
    assert.ok(path.includes('/services/#' + service));
    assert.ok(path.includes('/contact/#quote-' + topic));
    assert.doesNotMatch(path, /mailto:/);
    assert.ok(services.includes('id="' + service + '" tabindex="-1"'));
    assert.ok(contact.includes('id="quote-' + topic + '" tabindex="-1"'));
  }
  assert.match(portfolio, /href="\/contact\/#quote-choices">Choose a quote template<\/a>, including “Not sure yet\.”/);
  assert.match(portfolio, /portfolio-storefront\.css\?v=4/);
  const css = load('assets/portfolio-storefront.css');
  assert.match(css, /\.portfolio-lab-next \.btn\{[^}]*min-height:44px/);
  assert.match(css, /\.portfolio-live-link\{[^}]*min-height:44px/);
});
