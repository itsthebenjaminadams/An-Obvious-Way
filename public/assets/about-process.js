(() => {
  'use strict';

  const target = document.getElementById('handoff-check');
  const disclosure = target?.closest('details');
  if (!disclosure) return;

  function revealLinkedHandoff() {
    if (window.location.hash === '#handoff-check') disclosure.open = true;
  }

  // Reveal before native fragment scrolling/focus. Don't steal focus on load
  // or reopen a manually collapsed disclosure on a cached history restore.
  revealLinkedHandoff();
  window.addEventListener('hashchange', revealLinkedHandoff);
})();
