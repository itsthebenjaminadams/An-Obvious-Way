(() => {
  'use strict';

  const opener = document.querySelector('[data-quick-find]');
  if (!opener) return;
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;

  // Path, label, helpful action, and aliases. All destinations are static site links.
  const pages = [
    ['/services/#all-services', 'Services and starting prices', 'Compare services, starting prices and quote options.', 'service finder options compare services prices pricing cost rates'],
    ['/services/#tech-support', 'Tech support and diagnostic prices', 'Get help with devices, Windows, Wi-Fi or setup.', 'computer laptop pc fix repair troubleshooting internet wifi wireless network connection hardware remote access keeps dropping disconnecting unreliable diagnostic diagnostics cost price prices pricing rates'],
    ['/services/#web-development', 'Website development and starting prices', 'Build or improve a small-business site.', 'website websites web design create new landing page mobile small business business site navigation redesign price pricing cost'],
    ['/services/#workflow-automation', 'Workflow automation and starting prices', 'Cut repetitive steps from a report or spreadsheet.', 'automate automated script task data processing spreadsheet excel csv recurring report repeat manual cleanup clean fix weekly cost price prices pricing rates'],
    ['/contact/#quote-choices', 'Request a quote', 'Choose a quote template or start with Not sure yet.', 'quotes email draft'],
    ['/contact/#quote-support', 'Start a tech support quote', 'Use an email draft or copy the webmail template.', 'support computer repair quote cost price wifi windows email help estimate keeps dropping disconnecting unreliable diagnostic diagnostics'],
    ['/contact/#quote-web', 'Start a website quote', 'Use an email draft or copy the webmail template.', 'web design website websites site small business quote cost price mobile email contact estimate new'],
    ['/contact/#quote-automation', 'Start an automation quote', 'Use an email draft or copy the webmail template.', 'workflow automation report spreadsheet data quote price cost email estimate cleanup clean weekly recurring'],
    ['/contact/#preflight-title', 'Prepare a quote request', 'Gather the right details before you reach out.', 'start contact intake preflight scope brief question estimate prepare checklist'],
    ['/portfolio/#report-demo-title', 'Report repair challenge', 'Optional demo: see how a report flags bad rows.', 'demo game interactive play challenge lab repair automation spreadsheet data workflow fix errors'],
    ['/portfolio/#support-puzzle', 'Dropping call puzzle', 'Optional demo: see how we narrow down a Wi-Fi problem.', 'tech support wifi repair demo game lab interactive troubleshooting diagnosis internet network video call team meeting'],
    ['/portfolio/#featured-project', 'Website case study', 'See how AOW replaced a dead-end contact form.', 'portfolio work examples project sample before after site design contact quote flow'],
    ['/about/#how-we-work', 'How AOW works', 'See how we scope and hand off small projects.', 'about team process delivery project support approach'],
    ['/contact/', 'Contact AOW', 'Find ways to start a conversation or request a quote.', 'mail email contact get in touch ask message'],
    ['/portfolio/', 'Explore the portfolio', 'Start with AOW’s live website case study; demos are optional.', 'projects previous work fun demo samples interactive'],
    ['/', 'AOW homepage', 'Return to the main site.', 'home homepage start bios mission control landing page'],
    ['/contact/#quote-general', 'Describe your project', 'Start a general draft if you’re not sure which service fits.', 'general project email draft']
  ];

  // Only match these whole questions or named tools. An unrelated qualification should not
  // route someone to a generic answer, and terse service searches retain their ranking.
  const guidance = [
    [new Set(['diagnostic scope', 'diagnostic vs repair', 'diagnostic versus repair', 'what does a diagnostic cover', 'what does the diagnostic cover', 'what is included in a diagnostic', 'what s included in a diagnostic', 'what s included in the 49 diagnostic', 'what does the 49 diagnostic cover', 'is 49 the repair price']),
      { url: '/services/#tech-support', title: 'What a tech support diagnostic covers', description: 'See what the diagnostic includes and why it is not a fixed repair price.' }],
    [new Set(['does requesting a quote book a diagnostic', 'does a quote book a diagnostic', 'does requesting a quote approve a repair', 'does a tech support quote book a diagnostic']),
      { url: '/contact/#quote-support', title: 'Requesting a tech support quote', description: 'An email request doesn’t book a diagnostic or approve repair work.' }],
    [new Set(['service finder', 'find my service', 'find your service', 'which service fits', 'which service do i need', 'what service do i need', 'not sure which service fits', 'help me choose a service']),
      { url: '/services/#service-finder', title: 'Find your service', description: 'Pick a goal and see the best place to start.' }],
    [new Set(['what to include', 'what should i include', 'what should i include in a quote request', 'what should i put in my email', 'what do i include in my email', 'what to include in my email', 'what to include in a quote request', 'what information do you need for a quote', 'what do you need for a quote']),
      { url: '/contact/#preflight-title', title: 'What to include in a quote request', description: 'See which project details help and what to leave out.' }],
    [new Set(['what happens after i email', 'what happens after i email you', 'what happens after i send an email', 'what happens after i request a quote', 'what happens after requesting a quote', 'what happens next', 'what to expect after emailing', 'what to expect after requesting a quote']),
      { url: '/contact/#after-email', title: 'What happens after I email?', description: 'See how AOW follows up and when you decide whether to proceed.' }],
    [new Set(['webmail', 'use webmail', 'no email app', 'email app did not open', 'email app didn t open', 'email app doesn t open', 'no email app use webmail', 'how do i use webmail', 'copy a quote template', 'copy quote template']),
      { url: '/contact/#webmail-general', title: 'Use webmail for a quote', description: 'Copy the recipient, subject and message without opening an email app.' }],
    [new Set(['email address', 'contact email address', 'aow email address', 'copy email address', 'what is your email address', 'what is the aow email address', 'where do i send my email']),
      { url: '/contact/#contact-email', title: 'AOW email address', description: 'View or copy the address without opening an email app.' }]
  ];

  const noise = new Set(['a', 'an', 'and', 'can', 'do', 'does', 'for', 'get', 'how', 'i', 'in', 'is', 'much', 'my', 'need', 'of', 'on', 'please', 'the', 'to', 'with']);
  const tokenize = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\bwi[\s\u2010-\u2015-]?fi\b/g, 'wifi').match(/[a-z0-9]+/g) || [];
  const searchIndex = pages.map(([url, title, description, aliases]) => {
    const otherWords = tokenize(description + ' ' + aliases);
    return { url, title, description, titleWords: tokenize(title), otherWords,
      unqualifiedWords: otherWords.filter(word => word !== 'disconnecting') };
  });
  const featured = [0, 1, 2, 3, 13].map(index => searchIndex[index]);
  const connectionTopics = new Set(['wifi', 'wireless', 'network', 'internet', 'computer', 'laptop', 'pc', 'windows']);
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

  const queryTerms = query => [...new Set(tokenize(query).filter(word => !noise.has(word)))];

  // Recognize the destination even when a visitor omits “quote” or types the words in
  // a different order. Exact topic sets avoid routing mixed requests or ignoring exclusions.
  const webmailTopics = [
    [new Set(['web', 'web design', 'web development', 'website', 'website design', 'website development']), 'web', 'Website'],
    [new Set(['support', 'tech support', 'computer repair', 'wifi support']), 'support', 'Tech support'],
    [new Set(['automation', 'workflow automation', 'spreadsheet automation']), 'automation', 'Automation']
  ].map(([topics, id, label]) => [topics, {
    url: '/contact/#webmail-' + id,
    title: label + ' quote for webmail',
    description: 'Copy the ' + label.toLowerCase() + ' quote template into your email.'
  }]);
  const templateWords = new Set(['webmail', 'quote', 'template', 'copy', 'use']);
  const matchesWebmailTopic = (topics, words) => [...topics].some(topic => {
    const expected = topic.split(' ');
    return expected.length === words.length && expected.every(word => words.includes(word));
  });

  function serviceWebmail(terms) {
    if (!terms.includes('webmail') && !['copy', 'quote', 'template'].every(word => terms.includes(word))) return null;
    const topic = terms.filter(word => !templateWords.has(word));
    // “or” isn't noise; “and” is, so mixed topics still cannot match a single service.
    return webmailTopics.find(([topics]) => matchesWebmailTopic(topics, topic))?.[1] || null;
  }

  // Strip only recognized opening phrases, not unmatched words within a request.
  // Keep "cost" in the pricing wrapper and leave all exclusions in the topic.
  const spokenOpeners = [
    [/^how much does it cost to\s+/, 'cost '],
    [/^how much would\s+/, ''],
    [/^what does\s+/, ''],
    [/^can (?:you|someone) help(?: me)? with\s+/, ''],
    [/^(?:can you )?clean up\s+/, 'clean '],
    [/^i need someone to\s+/, '']
  ];

  function search(query) {
    const bounded = query.slice(0, 80);
    if (query.length < 80) {
      const phrase = tokenize(bounded).join(' ');
      const answer = guidance.find(([phrases]) => phrases.has(phrase));
      if (answer) return [answer[1]];
    }
    const terms = queryTerms(bounded);
    if (!terms.length) return null;
    const webmail = query.length < 80 && serviceWebmail(terms);
    if (webmail) return [webmail];
    const exact = rank(terms);
    if (exact.length) return exact;
    if (query.length >= 80) return []; // A truncated request may omit a qualification.
    const spoken = bounded.toLowerCase().replace(/’/g, "'").trim();
    if (/\b(?:not|no|never|without|except|excluding|avoid|rather|instead)\b|\bnor\b|n't\b/.test(spoken)) return [];
    const opener = spokenOpeners.find(([pattern]) => pattern.test(spoken));
    if (!opener) return [];
    const topic = queryTerms(spoken.replace(opener[0], opener[1]));
    return topic.length ? rank(topic) : [];
  }

  function rank(terms) {
    if (!terms.length) return null;
    // Put service information ahead of optional demos unless the visitor asks for a demo.
    const buying = terms.some(term => ['quote', 'pricing', 'price', 'prices', 'cost', 'estimate'].includes(term));
    const demoIntent = !buying && (terms.some(term => ['demo', 'game', 'puzzle', 'lab', 'challenge', 'interactive'].includes(term))
      || (terms.includes('dropping') && terms.includes('call'))
      || (terms.includes('report') && terms.includes('repair')));
    const priority = match => demoPaths.has(match.item.url) === demoIntent ? 1 : 0;
    // A disconnection alone doesn't establish that the visitor means a supported device or connection.
    const connectionTopic = terms.some(term => connectionTopics.has(term));
    return searchIndex.map(item => {
      const aliases = connectionTopic ? item.otherWords : item.unqualifiedWords;
      const scores = terms.map(term => Math.max(wordScore(term, item.titleWords, 8), wordScore(term, aliases, 4)));
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
  input.enterKeyHint = 'go';
  input.maxLength = 80;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Try “Wi-Fi”, “website quote”, or “pricing”';
  input.setAttribute('aria-describedby', 'quick-find-hint');
  const hint = make('p', 'quick-find-hint', 'Press Enter to open a single match, or Tab to browse links. Search text stays on this page.');
  hint.id = 'quick-find-hint';
  const status = make('p', 'quick-find-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  const list = make('ul', 'quick-find-results');
  list.setAttribute('aria-label', 'Matching page links');
  const empty = make('p', 'quick-find-empty');
  const recovery = make('ul', 'quick-find-results');
  recovery.setAttribute('aria-label', 'Browse instead');
  recovery.hidden = true;
  for (const [url, title] of [
    ['/services/#all-services', 'Compare all services'],
    ['/contact/#quote-general', 'Describe your project']
  ]) {
    const li = make('li');
    const link = make('a', '', title);
    link.href = url;
    li.append(link);
    recovery.append(li);
  }
  dialog.append(header, label, input, hint, status, list, empty, recovery);
  document.body.append(dialog);
  opener.hidden = false;

  let singleResult = null;

  function render() {
    const query = input.value.trim();
    const matches = search(query);
    const results = !query || matches === null ? featured : matches;
    singleResult = null;
    const links = results.map(({url, title, description}) => {
      const li = make('li');
      const a = make('a');
      a.href = url;
      a.append(make('strong', '', title), make('span', '', description));
      li.append(a);
      if (query && matches?.length === 1) singleResult = a;
      return li;
    });
    list.replaceChildren(...links);
    list.hidden = links.length === 0;
    empty.hidden = links.length !== 0;
    recovery.hidden = !query || matches === null || matches.length !== 0;
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
  input.addEventListener('keydown', event => {
    if (!dialog.open || !singleResult || event.key !== 'Enter' ||
        event.defaultPrevented || event.repeat || event.isComposing || event.keyCode === 229 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    singleResult.click();
  });
  function closeOnNavigation(event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (event.target.closest('a[href]')) {
      navigating = true;
      dialog.close();
    }
  }
  list.addEventListener('click', closeOnNavigation);
  recovery.addEventListener('click', closeOnNavigation);
  // Native Escape dispatches close too; never override the browser's keyboard shortcuts.
  dialog.addEventListener('close', () => {
    input.value = '';
    singleResult = null;
    if (!navigating) opener.focus({ preventScroll: true });
  });
})();
