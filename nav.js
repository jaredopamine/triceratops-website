/* ============================================================
   Mobile navigation — slide-in menu
   Shared across every page. A page only needs:

       <script src="nav.js" defer></script>

   The panel is built at runtime from that page's own .main-nav
   and .footer-social, so there is no duplicated markup to keep
   in sync across the five pages — add the script tag and the
   mobile menu appears, matching whatever that page's nav says.

   Behaviour comes from the Figma mobile frames:
   slides in from the right, "Getting Started" expands in place
   as a dropdown, and closing is available via the X, the
   overlay, or Escape.
============================================================ */
(function () {
  'use strict';

  var headerInner = document.querySelector('.site-header__inner');
  var nav = headerInner && headerInner.querySelector('.main-nav');
  if (!headerInner || !nav) return;

  var lastFocused = null;

  /* Marks the page as having a working mobile menu. styles.css only
     hides the desktop nav when this class is present, so a page that
     has not added the script tag yet keeps its own nav instead of
     being left with no navigation at all below 640px. */
  document.body.classList.add('has-mobile-menu');

  /* ---------- hamburger button ---------- */
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'mobile-menu');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  headerInner.appendChild(toggle);

  /* ---------- overlay ---------- */
  var overlay = document.createElement('div');
  overlay.className = 'mobile-menu__overlay';
  document.body.appendChild(overlay);

  /* ---------- panel ---------- */
  var panel = document.createElement('div');
  panel.className = 'mobile-menu';
  panel.id = 'mobile-menu';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Site menu');

  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'mobile-menu__close';
  close.setAttribute('aria-label', 'Close menu');
  panel.appendChild(close);

  var list = document.createElement('nav');
  list.className = 'mobile-menu__nav';
  list.setAttribute('aria-label', 'Primary');
  panel.appendChild(list);

  /* Walk the desktop nav in order. A .nav-dropdown becomes an
     expandable group; everything else becomes a plain link. */
  Array.prototype.forEach.call(nav.children, function (child) {
    if (child.classList.contains('nav-dropdown')) {
      var trigger = child.querySelector('.main-nav__link');
      var sub = child.querySelector('.nav-dropdown__panel');
      if (!trigger) return;

      var group = document.createElement('div');
      group.className = 'mobile-menu__group';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-menu__link mobile-menu__trigger';
      btn.setAttribute('aria-expanded', 'false');
      var label = document.createElement('span');
      label.className = 'mobile-menu__label';
      label.textContent = trigger.textContent.trim();
      btn.appendChild(label);

      var chev = document.createElement('img');
      chev.className = 'mobile-menu__chevron';
      chev.src = 'assets/chevron-down.svg';
      chev.alt = '';
      btn.appendChild(chev);
      group.appendChild(btn);

      var subWrap = document.createElement('div');
      subWrap.className = 'mobile-menu__sub';
      if (sub) {
        Array.prototype.forEach.call(sub.querySelectorAll('a'), function (a) {
          var link = document.createElement('a');
          link.className = 'mobile-menu__link mobile-menu__sublink';
          link.href = a.getAttribute('href') || '#';
          link.textContent = a.textContent.trim();
          subWrap.appendChild(link);
        });
      }
      group.appendChild(subWrap);

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        group.classList.toggle('is-open', !open);
        /* Animate to the measured height so the reveal eases like
           the rest of the menu; height:auto is not animatable. */
        subWrap.style.maxHeight = open ? '' : subWrap.scrollHeight + 'px';
      });

      list.appendChild(group);
    } else if (child.matches('a')) {
      var a = document.createElement('a');
      a.className = 'mobile-menu__link';
      a.href = child.getAttribute('href') || '#';
      a.textContent = child.textContent.trim();
      if (child.hasAttribute('aria-current')) {
        a.setAttribute('aria-current', child.getAttribute('aria-current'));
        a.classList.add('mobile-menu__link--current');
      }
      list.appendChild(a);
    }
  });

  /* Social icons, cloned from this page's footer if it has them. */
  var social = document.querySelector('.footer-social');
  if (social) {
    var copy = social.cloneNode(true);
    copy.classList.add('mobile-menu__social');
    panel.appendChild(copy);
  }

  document.body.appendChild(panel);

  /* ---------- open / close ---------- */
  function setOpen(open) {
    document.body.classList.toggle('menu-open', open);
    panel.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    /* inert keeps the off-screen panel out of the tab order and
       out of the accessibility tree while it is closed. */
    if (open) {
      panel.removeAttribute('inert');
      lastFocused = document.activeElement;
      close.focus();
    } else {
      panel.setAttribute('inert', '');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }
  }

  panel.setAttribute('inert', '');
  toggle.addEventListener('click', function () {
    setOpen(!panel.classList.contains('is-open'));
  });
  close.addEventListener('click', function () { setOpen(false); });
  overlay.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) setOpen(false);
  });
  /* Following a link should not leave the menu open behind it. */
  list.addEventListener('click', function (e) {
    if (e.target.matches('a')) setOpen(false);
  });
  /* If the viewport grows back to desktop, drop the menu state so
     the page is not left scroll-locked behind a hidden panel. */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 640 && panel.classList.contains('is-open')) setOpen(false);
  });
})();
