(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const header = document.querySelector('.site-header');

  if (!toggle || !menu || !header) return;

  const openText = document.body.dataset.menuOpenText || 'Menu';
  const closeText = document.body.dataset.menuCloseText || 'Close';
  const openAria = document.body.dataset.menuOpenAria || 'Open menu';
  const closeAria = document.body.dataset.menuCloseAria || 'Close menu';

  const setOpen = (isOpen, { restoreFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? closeAria : openAria);
    toggle.textContent = isOpen ? closeText : openText;
    menu.hidden = !isOpen;
    document.body.classList.toggle('menu-open', isOpen);
    header.classList.toggle('is-menu-open', isOpen);
    if (restoreFocus) toggle.focus();
  };

  setOpen(false);
  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false, { restoreFocus: true });
    }
  });

  const desktopQuery = window.matchMedia('(min-width: 1081px)');
  const handleDesktopChange = (event) => {
    if (event.matches) setOpen(false);
  };
  desktopQuery.addEventListener?.('change', handleDesktopChange);
})();
