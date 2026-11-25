(() => {
  'use strict';

  const demoHashes = new Set(['#support-puzzle', '#report-demo-title']);

  function openLinkedDemo() {
    const hash = window.location.hash;
    if (!demoHashes.has(hash)) return;
    const summary = document.getElementById(hash.slice(1));
    const disclosure = summary?.closest('details[data-portfolio-lab]');
    if (!disclosure || disclosure.open) return;
    disclosure.open = true;
    // Keep the requested visible summary under the header rather than hiding it.
    window.requestAnimationFrame(() => {
      if (window.location.hash === hash && disclosure.open) {
        summary.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
  }

  openLinkedDemo();
  window.addEventListener('hashchange', openLinkedDemo);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (link?.href === window.location.href) openLinkedDemo();
  });
  // Back/Forward to this cached page should keep any manual disclosure choice.
})();
