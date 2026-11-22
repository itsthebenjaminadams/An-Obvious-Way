(() => {
  const group = document.querySelector('[data-contact-address]');
  if (!group) return;
  const link = group.querySelector('[data-address-link]');
  const button = group.querySelector('[data-address-copy]');
  const fallback = group.querySelector('[data-address-fallback]');
  const input = group.querySelector('[data-address-text]');
  const status = group.querySelector('[data-address-status]');
  const address = link?.textContent.trim();
  if (!address || !button || !fallback || !input || !status) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(address);
      fallback.hidden = true;
      status.textContent = 'Email address copied.';
    } catch {
      input.value = address;
      fallback.hidden = false;
      input.focus();
      input.select();
      status.textContent = 'Automatic copy is unavailable. Copy the selected email address.';
    }
  });
})();
