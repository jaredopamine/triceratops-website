document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  const toggle = dropdown.querySelector('.nav-dropdown-toggle');
  let closeTimer = null;

  function open() {
    clearTimeout(closeTimer);
    dropdown.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function close() {
    dropdown.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function scheduleClose() {
    closeTimer = setTimeout(close, 150);
  }

  dropdown.addEventListener('mouseenter', open);
  dropdown.addEventListener('mouseleave', scheduleClose);
  toggle.addEventListener('focus', open);
  dropdown.addEventListener('focusout', (e) => {
    if (!dropdown.contains(e.relatedTarget)) close();
  });
  toggle.addEventListener('click', () => {
    dropdown.classList.contains('is-open') ? close() : open();
  });
  dropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); toggl
  });
});