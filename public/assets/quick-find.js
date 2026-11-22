(() => {
  'use strict';

  const opener = document.querySelector('[data-quick-find]');
  if (!opener) return;
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;

  // Path, label, helpful action, and aliases. All destinations are static site links.
  const pages = [
    ['/services/#all-services', 'Services and starting prices', 'Compare services, starting prices and quote options.', 'service finder options compare services prices pricing cost rates'],
    ['/services/#tech-support', 'Tech support', 'Get help with devices, Windows, Wi-Fi or setup.', 'computer laptop pc fix repair troubleshooting internet wifi wireless network connection hardware remote access keeps dropping unreliable'],
    ['/services/#web-development', 'Web development', 'Build or improve a small-business site.', 'website websites web design create new landing page mobile small business business site hosting navigation redesign'],
    ['/services/#workflow-automation', 'Workflow automation', 'Cut repetitive steps from a report or spreadsheet.', 'automate automated script task data processing spreadsheet excel csv recurring report repeat manual cleanup clean fix weekly'],
    ['/contact/#quote-support', 'Start a tech support quote', 'Use an email draft or copy the webmail template.', 'support computer repair quote cost price wifi windows email help estimate keeps dropping unreliable'],
    ['/contact/#quote-web', 'Start a website quote', 'Use an email draft or copy the webmail template.', 'web design website site quote cost price mobile email contact estimate new'],
    ['/contact/#quote-automation', 'Start an automation quote', 'Use an email draft or copy the webmail template.', 'workflow automation report spreadsheet data quote price cost email estimate'],
    ['/contact/#preflight-title', 'Prepare a quote request', 'Gather the right details before you reach out.', 'start contact intake preflight scope brief question estimate prepare checklist'],
    ['/portfolio/#report-demo-title', 'Report repair challenge', 'Optional demo: see how a report flags bad rows.', 'demo game interactive play challenge lab repair automation spreadsheet data workflow fix errors'],
    ['/portfolio/#support-puzzle', 'Dropping call puzzle', 'Optional demo: see how we narrow down a Wi-Fi problem.', 'tech support wifi repair demo game lab interactive troubleshooting diagnosis internet network video call team meeting'],
    ['/portfolio/#featured-project', 'Website case study', 'See how AOW replaced a dead-end contact form.', 'portfolio work examples project sample before after site design contact quote flow'],
    ['/about/#how-we-work', 'How AOW works', 'See how we scope and hand off small projects.', 'about team process delivery project support approach'],
    ['/contact/', 'Contact AOW', 'Find ways to start a conversation or request a quote.', 'mail email contact get in touch ask message'],
    ['/portfolio/', 'Explore the portfolio', 'Start with AOW’s live website case study; demos are optional.', 'projects previous work fun demo samples interactive'],
    ['/', 'AOW homepage', 'Return to the main site.', 'home homepage start bios mission control landing page']
  ];

  const noise = new Set(['a', 'an', 'and', 'can', 'do', 'does', 'for', 'get', 'how', 'i', 'in', 'is', 'much', 'my', 'need', 'of', 'on', 'please', 'the', 'to', 'with']);
  const tokenize = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\bwi[\s-]?fi\b/g, 'wifi').match(/[a-z0-9]+/g) || [];
  const searchIndex = pages.map(([url, title, description, aliases]) => ({
    url, title, description, titleWords: tokenize(title), otherWords: tokenize(description + ' ' + aliases)
  }));
  const featured = [0, 1, 2, 3, 12].map(index => searchIndex[index]);
  const demoPaths = new Set(['/portfolio/#report-demo-title', '/portfolio/#support-puzzle']);

  function near(term, word) {
    if (term.length < 5 || Math.abs(term.length - word.length) > 1) return false;
    // Match a single insertion, deletion, substitution or adjacent transposition.
    let from = 0;
    while (from < term.length && term[from] === word[from]) from++;
    if (term.length < word.length) return term.slice(from) === word.slice(from + 1);
    if (term.length > word.length) return term.slice(from + 1) === word.slice(from);
    if (term.slice(from + 1) === word.slice(from + 1)) return true;
    return term[from] === word[from + 1] && term[from + 1] === word[from]
      && term.slice(from + 2) === word.slice(from + 2);
  }

  function wordScore(term, candidates, points) {
    if (candidates.includes(term)) return points;
    if (term.length >= 2 && candidates.some(word => word.startsWith(term))) return points - 1;
    if (candidates.some(word => near(term, word))) return 1;
    return 0;
  }

  function search(query) {
    const terms = [...new Set(tokenize(query.slice(0, 80)).filter(word => !noise.has(word)))];
    if (!terms.length) return null;
    // Put service information ahead of optional demos unless the visitor asks for a demo.
    const buying = terms.some(term => ['quote', 'pricing', 'price', 'prices', 'cost', 'estimate'].includes(term));
    const demoIntent = !buying && (terms.some(term => ['demo', 'game', 'puzzle', 'lab', 'challenge', 'interactive'].includes(term))
      || (terms.includes('dropping') && terms.includes('call'))
      || (terms.includes('report') && terms.includes('repair')));
    const priority = match => demoPaths.has(match.item.url) === demoIntent ? 1 : 0;
    return searchIndex.map(item => {
      const scores = terms.map(term => Math.max(wordScore(term, item.titleWords, 8), wordScore(term, item.otherWords, 4)));
      return { item, weight: scores.every(score => score > 0) ? scores.reduce((sum, score) => sum + score, 0) : 0 };
    }).filter(match => match.weight > 0).sort((a, b) => priority(b) - priority(a) || b.weight - a.weight).slice(0, 7).map(match => match.item);
  }

  function make(tag, cls, content) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content) el.textContent = content;
    return el;
  }

  dialog.id = 'quick-find';
  dialog.className = 'quick-find-panel';
  dialog.setAttribute('aria-labelledby', 'quick-find-title');
  const header = make('div', 'quick-find-header');
  const title = make('h2', '', 'Quick Find');
  title.id = 'quick-find-title';
  const close = make('button', 'quick-find-close', 'Close');
  close.type = 'button';
  header.append(title, close);
  const label = make('label', '', 'Search AOW');
  label.htmlFor = 'quick-find-input';
  const input = make('input', 'quick-find-input');
  input.id = 'quick-find-input';
  input.type = 'search';
  input.maxLength = 80;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Try “Wi-Fi”, “website quote”, or “pricing”';
  input.setAttribute('aria-describedby', 'quick-find-hint');
  const hint = make('p', 'quick-find-hint', 'Type a goal or topic, then Tab to the links. Searches stay on this page.');
  hint.id = 'quick-find-hint';
  const status = make('p', 'quick-find-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  const list = make('ul', 'quick-find-results');
  list.setAttribute('aria-label', 'Matching page links');
  const empty = make('p', 'quick-find-empty');
  dialog.append(header, label, input, hint, status, list, empty);
  document.body.append(dialog);
  opener.hidden = false;

  function render() {
    const query = input.value.trim();
    const matches = search(query);
    const results = !query || matches === null ? featured : matches;
    const links = results.map(({url, title, description}) => {
      const li = make('li');
      const a = make('a');
      a.href = url;
      a.append(make('strong', '', title), make('span', '', description));
      li.append(a);
      return li;
    });
    list.replaceChildren(...links);
    list.hidden = links.length === 0;
    empty.hidden = links.length !== 0;
    empty.textContent = links.length ? '' : 'Try a short topic such as “website”, “tech support”, “quote”, or “demo”.';
    status.textContent = !query ? 'Popular starting points' : matches === null ? 'Enter a topic to search'
      : matches.length === 1 ? '1 result' : matches.length ? matches.length + ' results' : 'No matches';
  }

  let navigating = false;
  opener.addEventListener('click', () => {
    if (dialog.open) return;
    navigating = false;
    input.value = '';
    render();
    dialog.showModal();
    input.focus();
  });
  close.addEventListener('click', () => dialog.close());
  input.addEventListener('input', render);
  list.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (event.target.closest('a[href]')) {
      navigating = true;
      dialog.close();
    }
  });
  // Native Escape dispatches close too; never override the browser's keyboard shortcuts.
  dialog.addEventListener('close', () => {
    input.value = '';
    if (!navigating) opener.focus({ preventScroll: true });
  });
})();
