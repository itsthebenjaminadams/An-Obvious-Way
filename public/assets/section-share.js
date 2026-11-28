(() => {
  'use strict';

  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  if (!canonical) return;
  const page = new URL(canonical);
  if (page.origin !== 'https://anobviousway.com' || page.search || page.hash) return;

  for (const widget of document.querySelectorAll('[data-section-share]')) {
    const fragment = widget.dataset.sectionShare;
    const target = document.getElementById(fragment);
    const button = widget.querySelector('[data-section-share-copy]');
    const status = widget.querySelector('[data-section-share-status]');
    const fallback = widget.querySelector('[data-section-share-fallback]');
    const field = widget.querySelector('[data-section-share-url]');
    if (!target || !button || !status || !fallback || !field?.readOnly) continue;
    const url = new URL(page);
    url.hash = fragment;
    field.value = url.href;
    widget.hidden = false;
    let operation = 0;
    button.addEventListener('click', async () => {
      const attempt = ++operation;
      const focused = document.activeElement;
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(url.href);
        if (attempt !== operation) return;
        if (document.activeElement !== field) fallback.hidden = true;
        status.textContent = 'Link copied.';
      } catch {
        if (attempt !== operation) return;
        fallback.hidden = false;
        if (focused === button && document.activeElement === button) {
          field.focus();
          field.select();
          status.textContent = 'Copy the selected link.';
        } else {
          status.textContent = 'Select and copy the link below.';
        }
      }
    });
  }
})();
