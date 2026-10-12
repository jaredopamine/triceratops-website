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

  /* Cloned from the real header logo so it keeps working relative
     links/assets, rather than hardcoding a path here. */
  var siteLogo = document.querySelector('.site-logo');
  if (siteLogo) {
    var logo = siteLogo.cloneNode(true);
    logo.classList.add('mobile-menu__logo');
    panel.appendChild(logo);
  }

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

      /* Split button: the word itself is a real link to the trigger's
         own page (e.g. Getting Started), so it no longer needs to be
         duplicated inside the dropdown — only the chevron toggles the
         sub-list, which now holds just its actual children. */
      var row = document.createElement('div');
      row.className = 'mobile-menu__trigger-row';

      var mainLink = document.createElement('a');
      mainLink.className = 'mobile-menu__link mobile-menu__trigger-link';
      mainLink.href = trigger.getAttribute('href') || '#';
      var mainLinkText = document.createElement('span');
      mainLinkText.className = 'mobile-menu__link-text';
      mainLinkText.textContent = trigger.textContent.trim();
      mainLink.appendChild(mainLinkText);
      if (trigger.hasAttribute('aria-current')) {
        mainLink.setAttribute('aria-current', trigger.getAttribute('aria-current'));
        mainLink.classList.add('mobile-menu__link--current');
      }
      row.appendChild(mainLink);

      var chevBtn = document.createElement('button');
      chevBtn.type = 'button';
      chevBtn.className = 'mobile-menu__chevron-btn';
      chevBtn.setAttribute('aria-expanded', 'false');
      chevBtn.setAttribute('aria-label', 'Toggle ' + mainLink.textContent + ' submenu');
      var chev = document.createElement('img');
      chev.className = 'mobile-menu__chevron';
      chev.src = 'assets/chevron-down.svg';
      chev.alt = '';
      chevBtn.appendChild(chev);
      row.appendChild(chevBtn);

      group.appendChild(row);

      var subWrap = document.createElement('div');
      subWrap.className = 'mobile-menu__sub';
      var subLinks = sub ? Array.prototype.slice.call(sub.querySelectorAll('a')) : [];
      subLinks.forEach(function (a) {
        var link = document.createElement('a');
        link.className = 'mobile-menu__link mobile-menu__sublink';
        link.href = a.getAttribute('href') || '#';
        var subLinkText = document.createElement('span');
        subLinkText.className = 'mobile-menu__link-text';
        subLinkText.textContent = a.textContent.trim();
        link.appendChild(subLinkText);
        if (a.hasAttribute('aria-current')) {
          link.setAttribute('aria-current', a.getAttribute('aria-current'));
          link.classList.add('mobile-menu__link--current');
        }
        subWrap.appendChild(link);
      });
      group.appendChild(subWrap);

      chevBtn.addEventListener('click', function () {
        var open = chevBtn.getAttribute('aria-expanded') === 'true';
        chevBtn.setAttribute('aria-expanded', String(!open));
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
      var linkText = document.createElement('span');
      linkText.className = 'mobile-menu__link-text';
      linkText.textContent = child.textContent.trim();
      a.appendChild(linkText);
      if (child.hasAttribute('aria-current')) {
        a.setAttribute('aria-current', child.getAttribute('aria-current'));
        a.classList.add('mobile-menu__link--current');
      }
      list.appendChild(a);
    }
  });

  /* Discord/Instagram CTA buttons — same shape as Rules' mobile menu
     buttons, replacing the small black footer-icon circles. */
  var discordCta = document.createElement('a');
  discordCta.className = 'mobile-menu__cta';
  discordCta.href = 'https://discord.gg/MzDujDpgZ9';
  discordCta.target = '_blank';
  discordCta.rel = 'noopener';
  discordCta.innerHTML = '<img src="assets/discord-icon.svg" alt="" aria-hidden="true">Join Our Discord';
  panel.appendChild(discordCta);

  var instagramCta = document.createElement('a');
  instagramCta.className = 'mobile-menu__cta mobile-menu__cta--instagram';
  instagramCta.href = 'https://www.instagram.com/davis_triceratops/';
  instagramCta.target = '_blank';
  instagramCta.rel = 'noopener';
  instagramCta.innerHTML = '<img src="assets/instagram-social-icon.svg" alt="" aria-hidden="true">Follow Our Instagram';
  panel.appendChild(instagramCta);

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
