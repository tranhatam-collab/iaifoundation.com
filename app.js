(() => {
  const body = document.body;
  body.classList.add('js-ready');
  const currentLang = document.documentElement.lang.toLowerCase().startsWith('vi') ? 'vi' : 'en';
  const DESKTOP_MENU_BREAKPOINT = 1080;

  if (window.location.hostname === 'www.iaifoundation.com') {
    const preferredUrl = new URL(window.location.href);
    preferredUrl.hostname = 'iaifoundation.com';
    window.location.replace(preferredUrl.toString());
    return;
  }

  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    const header = toggle.closest('.site-header');
    const menuCopy = {
      openText: body.dataset.menuOpenText || 'Menu',
      closeText: body.dataset.menuCloseText || 'Close',
      openAria: body.dataset.menuOpenAria || 'Open menu',
      closeAria: body.dataset.menuCloseAria || 'Close menu',
    };

    const setMenuState = (isOpen) => {
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? menuCopy.closeAria : menuCopy.openAria);
      toggle.textContent = isOpen ? menuCopy.closeText : menuCopy.openText;
      menu.hidden = !isOpen;
      menu.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      if (header) {
        header.classList.toggle('is-menu-open', isOpen);
      }
    };

    const syncMenuForViewport = () => {
      if (window.innerWidth >= DESKTOP_MENU_BREAKPOINT) {
        setMenuState(false);
        return;
      }
      setMenuState(toggle.getAttribute('aria-expanded') === 'true');
    };

    setMenuState(false);
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setMenuState(!isOpen);
    });
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        setMenuState(false);
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setMenuState(false);
      }
    });
    document.addEventListener('click', (event) => {
      if (menu.hidden || window.innerWidth >= DESKTOP_MENU_BREAKPOINT || !header) {
        return;
      }
      if (event.target instanceof Node && !header.contains(event.target)) {
        setMenuState(false);
      }
    });
    syncMenuForViewport();
    window.addEventListener('resize', syncMenuForViewport);
  }

  const form = document.getElementById('waitlist-form');
  const msg = document.getElementById('waitlist-message');
  if (form && msg) {
    const successMessage = body.dataset.waitlistSuccess
      || (currentLang === 'vi'
        ? 'Cảm ơn bạn. Chúng tôi sẽ liên hệ khi các chương trình thí điểm mở.'
        : 'Thank you. We will be in touch as pilot programs open.');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;
      if (!email) return;
      form.style.display = 'none';
      msg.hidden = false;
      msg.textContent = successMessage;
    });
  }
})();
