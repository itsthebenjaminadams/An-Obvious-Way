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
  let operation = 0;
  button.hidden = false;
  button.addEventListener('click', async () => {
    const id = ++operation;
    const originalFocus = document.activeElement;
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(address);
      if (id !== operation) return;
      if (document.activeElement !== input) fallback.hidden = true;
      status.textContent = 'Email address copied.';
    } catch {
      if (id !== operation) return;
      input.value = address;
      fallback.hidden = false;
      if (document.activeElement === originalFocus) {
        input.focus();
        input.select();
        status.textContent = 'Automatic copy is unavailable. Copy the selected email address.';
      } else {
        status.textContent = 'Automatic copy is unavailable. The email address is available to select and copy.';
      }
    }
  });
})();

(() => {
  for (const template of document.querySelectorAll('[data-quote-template]')) {
    const status = template.querySelector('[data-copy-status]');
    if (!status) continue;
    let operation = 0;
    let previous;
    for (const button of template.querySelectorAll('[data-copy-field]')) {
      const row = button.parentElement;
      const feedback = row?.querySelector('[data-copy-feedback]');
      const field = document.getElementById(button.dataset.copyField);
      if (!feedback || !field || !template.contains(field) || !field.readOnly) continue;
      const name = button.dataset.copyName || (field.tagName === 'INPUT' ? 'Subject' : 'Message');
      row.hidden = false;
      button.hidden = false;
      button.addEventListener('click', async () => {
        const id = ++operation;
        const originalFocus = document.activeElement;
        if (previous) previous.textContent = '';
        previous = feedback;
        status.textContent = '';
        let message;
        let caption;
        try {
          await navigator.clipboard.writeText(field.value);
          message = `${name} copied.`;
          caption = 'Copied.';
        } catch {
          if (id !== operation || !template.open) return;
          if (document.activeElement === originalFocus) {
            field.focus();
            field.select();
            message = `Automatic copy is unavailable. Copy the selected ${name.toLowerCase()}.`;
          } else {
            message = `Automatic copy is unavailable. Select and copy the ${name.toLowerCase()} above.`;
          }
        }
        if (id !== operation || !template.open) return;
        feedback.textContent = caption || message;
        status.textContent = message;
      });
    }
  }
})();
