// Mobile menu
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// "Getting Started" dropdown
const dropdownToggle = document.querySelector('.nav__dropdown-toggle');
const dropdown = dropdownToggle && document.getElementById(dropdownToggle.getAttribute('aria-controls'));

function setDropdownOpen(isOpen) {
  dropdown.hidden = !isOpen;
  dropdownToggle.setAttribute('aria-expanded', String(isOpen));
}

if (dropdownToggle && dropdown) {
  dropdownToggle.addEventListener('click', () => {
    setDropdownOpen(dropdown.hidden);
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.hidden && !event.target.closest('.nav__item--dropdown')) {
      setDropdownOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dropdown.hidden) {
      setDropdownOpen(false);
      dropdownToggle.focus();
    }
  });
}

// Hero scroll arrow: fades out once the page is scrolled, returns at the very top
const heroScroll = document.querySelector('.hero__scroll');

if (heroScroll) {
  const updateHeroScroll = () => {
    heroScroll.classList.toggle('is-hidden', window.scrollY > 0);
  };

  window.addEventListener('scroll', updateHeroScroll, { passive: true });
  updateHeroScroll();
}

// Community gallery carousel
const gallery = document.querySelector('.gallery');

if (gallery) {
  const slides = Array.from(gallery.querySelectorAll('.gallery__slide'));
  const dots = Array.from(gallery.querySelectorAll('.gallery__dot'));
  let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));

  // direction ('prev' or 'next') picks which way the slides travel; see styles.css
  function showSlide(index, direction) {
    const previous = current;
    current = (index + slides.length) % slides.length;
    if (current === previous) return;

    gallery.dataset.direction = direction;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      slide.classList.toggle('is-entering', i === current);
      slide.classList.toggle('is-leaving', i === previous);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      if (i === current) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  slides.forEach((slide) => {
    slide.addEventListener('animationend', (event) => {
      if (event.target === slide) slide.classList.remove('is-entering', 'is-leaving');
    });
  });

  gallery.querySelector('.gallery__arrow--prev').addEventListener('click', () => showSlide(current - 1, 'prev'));
  gallery.querySelector('.gallery__arrow--next').addEventListener('click', () => showSlide(current + 1, 'next'));

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => showSlide(i, i > current ? 'next' : 'prev'));
  });

  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showSlide(current - 1, 'prev');
    if (event.key === 'ArrowRight') showSlide(current + 1, 'next');
  });
}

// Polaroid lightbox: clicking a gallery polaroid enlarges a copy of it over a scrim
const polaroids = document.querySelectorAll('.gallery .polaroid');

if (polaroids.length) {
  const DURATION = 450;
  const AT_REST = 'translate(0px, 0px) rotate(0deg) scale(1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // A modal dialog keeps the rest of the page from being clicked or focused
  const lightbox = document.createElement('dialog');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('aria-label', 'Enlarged photo');

  const scrim = document.createElement('div');
  scrim.className = 'lightbox__scrim';
  lightbox.append(scrim);
  document.body.append(lightbox);

  let original = null;
  let copy = null;
  let isClosing = false;

  const timing = () => ({
    duration: reduceMotion.matches ? 0 : DURATION,
    easing: 'ease',
    fill: 'both',
  });

  // The transform that puts the enlarged copy exactly over the polaroid in the gallery
  function transformToOriginal() {
    const from = original.getBoundingClientRect();
    const to = copy.getBoundingClientRect();
    const originalStyle = getComputedStyle(original);
    const x = from.left + from.width / 2 - (to.left + to.width / 2);
    const y = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = parseFloat(originalStyle.width) / to.width;
    const angle = parseFloat(originalStyle.rotate) || 0;

    return `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${scale})`;
  }

  function openLightbox(polaroid) {
    if (original) return;
    original = polaroid;

    const style = getComputedStyle(polaroid);
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);
    const zoom = Math.min((window.innerWidth * 0.9) / width, (window.innerHeight * 0.9) / height, 2);

    copy = polaroid.cloneNode(true);
    copy.removeAttribute('tabindex');
    copy.style.width = `${width * zoom}px`;
    copy.style.height = `${height * zoom}px`;
    copy.style.fontSize = `${parseFloat(style.fontSize) * zoom}px`;
    lightbox.append(copy);

    lightbox.showModal();

    const start = transformToOriginal();
    polaroid.classList.add('is-inspected');
    copy.animate([{ transform: start }, { transform: AT_REST }], timing());
    scrim.animate([{ opacity: 0 }, { opacity: 1 }], timing());
  }

  function finishClosing() {
    if (!original) return;
    original.classList.remove('is-inspected');
    copy.remove();
    scrim.getAnimations().forEach((animation) => animation.cancel());
    original = null;
    copy = null;
    isClosing = false;
    if (lightbox.open) lightbox.close();
  }

  function closeLightbox() {
    if (!original || isClosing) return;
    isClosing = true;

    // Start from wherever the copy is now, in case it is still on its way in
    const transform = getComputedStyle(copy).transform;
    const opacity = getComputedStyle(scrim).opacity;
    copy.getAnimations().forEach((animation) => animation.cancel());
    scrim.getAnimations().forEach((animation) => animation.cancel());

    scrim.animate([{ opacity }, { opacity: 0 }], timing());
    copy
      .animate([{ transform: transform === 'none' ? AT_REST : transform }, { transform: transformToOriginal() }], timing())
      .finished.then(finishClosing, () => {});
  }

  polaroids.forEach((polaroid) => {
    polaroid.tabIndex = 0;
    polaroid.addEventListener('click', () => openLightbox(polaroid));
    polaroid.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(polaroid);
      }
    });
  });

  scrim.addEventListener('click', closeLightbox);

  // Keep the page behind from scrolling (touch scrolling is blocked in styles.css)
  const SCROLL_KEYS = [' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  lightbox.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
  lightbox.addEventListener('keydown', (event) => {
    if (SCROLL_KEYS.includes(event.key)) event.preventDefault();
  });

  // Escape plays the same closing animation instead of vanishing
  lightbox.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeLightbox();
  });

  lightbox.addEventListener('close', finishClosing);
}
