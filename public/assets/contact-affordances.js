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

(() => {
  for (const template of document.querySelectorAll('[data-quote-template]')) {
    const status = template.querySelector('[data-copy-status]');
    if (!status) continue;
    for (const button of template.querySelectorAll('[data-copy-field]')) {
      const field = document.getElementById(button.dataset.copyField);
      if (!field || !template.contains(field) || !field.readOnly) continue;
      const name = button.dataset.copyName || (field.tagName === 'INPUT' ? 'Subject' : 'Message');
      button.hidden = false;
      button.addEventListener('click', async () => {
        status.textContent = '';
        try {
          await navigator.clipboard.writeText(field.value);
          status.textContent = `${name} copied.`;
        } catch {
          if (!template.open) return;
          field.focus();
          field.select();
          status.textContent = `Automatic copy is unavailable. Copy the selected ${name.toLowerCase()}.`;
        }
      });
    }
  }
})();
