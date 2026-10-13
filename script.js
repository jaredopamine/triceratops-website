// The upright-phone layout in home.css starts at this width (a phone on its
// side gets the layout above it, which behaves like the desktop one here)
const phoneLayout = window.matchMedia('(max-width: 640px)');

// Mobile menu and "Getting Started" dropdown are handled by nav.js (the
// shared system every other page uses), not page-specific code here.

// Hero scroll arrow: fades out once the page is scrolled, returns at the very top
const heroScroll = document.querySelector('.hero__scroll');

if (heroScroll) {
  const updateHeroScroll = () => {
    heroScroll.classList.toggle('is-hidden', window.scrollY > 0);
  };

  window.addEventListener('scroll', updateHeroScroll, { passive: true });
  updateHeroScroll();
}

// Upcoming Events: the sticky notes scroll inside the calendar's height, with the
// fourth note peeking out at the bottom. On narrower screens the notes wrap onto
// more lines, so tell the CSS how tall the frame must be to keep that peek.
const eventsLayout = document.querySelector('.events__layout');
const eventNotes = eventsLayout ? Array.from(eventsLayout.querySelectorAll('.sticky-note')) : [];

if (eventNotes.length > 3 && 'ResizeObserver' in window) {
  const PEEK = 86; // how much of the fourth note shows in the design

  const updateEventsPeek = () => {
    eventsLayout.style.setProperty('--events-peek-height', `${eventNotes[3].offsetTop + PEEK}px`);
  };

  const notesObserver = new ResizeObserver(updateEventsPeek);
  eventNotes.slice(0, 3).forEach((note) => notesObserver.observe(note));
  updateEventsPeek();
}

// The fade at the top of the sticky notes only appears once they have been scrolled
const eventNotesList = document.querySelector('.events__notes-list');

if (eventNotesList) {
  const updateNotesFade = () => {
    eventNotesList.parentElement.classList.toggle('is-scrolled', eventNotesList.scrollTop > 0);
  };

  eventNotesList.addEventListener('scroll', updateNotesFade, { passive: true });
  updateNotesFade();
}

// Event types: always-open sticky notes on wide screens, an accordion on phones
const eventDetails = Array.from(document.querySelectorAll('.sticky-note__details'));

if (eventDetails.length) {
  const syncEventDetails = () => {
    eventDetails.forEach((details) => {
      const summary = details.querySelector('summary');
      details.open = !phoneLayout.matches;

      // An always-open note is not a control, so keep it out of the tab order
      if (phoneLayout.matches) {
        summary.removeAttribute('tabindex');
      } else {
        summary.tabIndex = -1;
      }
    });
  };

  phoneLayout.addEventListener('change', syncEventDetails);
  syncEventDetails();
}

// Phone gallery: the bar under the polaroids fills up as the row is scrolled through
const reelTrack = document.querySelector('.reel__track');

if (reelTrack) {
  const reel = reelTrack.parentElement;
  const photos = Array.from(reelTrack.children);

  // The photo whose resting place is closest to the row's left edge
  const leftmostPhoto = () => {
    const gutter = parseFloat(getComputedStyle(reelTrack).paddingLeft);
    const offsets = photos.map((photo) => (
      Math.abs(photo.offsetLeft - reelTrack.offsetLeft - gutter - reelTrack.scrollLeft)
    ));
    return photos[offsets.indexOf(Math.min(...offsets))];
  };

  const updateReel = () => {
    // How much of the row has been seen so far: what is on screen plus what was scrolled past
    const seen = (reelTrack.scrollLeft + reelTrack.clientWidth) / reelTrack.scrollWidth;
    reel.style.setProperty('--reel-progress', Math.min(seen, 1));

    // The leftmost photo straightens up; the rest stay tilted (see home.css)
    const current = leftmostPhoto();
    photos.forEach((photo) => photo.classList.toggle('is-current', photo === current));
  };

  reelTrack.addEventListener('scroll', updateReel, { passive: true });

  // Touch screens swipe the row natively; this lets a mouse drag it too
  let dragStartX = 0;
  let dragStartScroll = 0;
  let settleTimer = 0;
  let isDragging = false;

  const dragReel = (event) => {
    reelTrack.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  };

  // Glide to the nearest photo, then hand snapping back to the CSS
  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    window.removeEventListener('pointermove', dragReel);

    const gutter = parseFloat(getComputedStyle(reelTrack).paddingLeft);
    const nearest = leftmostPhoto().offsetLeft - reelTrack.offsetLeft - gutter;

    reelTrack.scrollTo({ left: nearest, behavior: 'smooth' });
    settleTimer = setTimeout(() => reelTrack.classList.remove('is-dragging'), 500);
  };

  reelTrack.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    clearTimeout(settleTimer);
    dragStartX = event.clientX;
    dragStartScroll = reelTrack.scrollLeft;
    isDragging = true;
    reelTrack.classList.add('is-dragging');
    // On the window, so the drag carries on if the mouse leaves the row
    window.addEventListener('pointermove', dragReel);
  });

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Keep the browser from dragging a ghost copy of a photo instead
  reelTrack.addEventListener('dragstart', (event) => event.preventDefault());
  updateReel();
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

// Gallery lightbox: clicking a polaroid or the photo strip enlarges a copy of it over a scrim
const polaroids = document.querySelectorAll('.gallery .polaroid, .gallery .photo-strip');

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

// Mobile community carousel — built from the desktop gallery slides above so
// the photos and testimonials only need to be authored once (same approach
// as nav.js's mobile menu).
const galleryMobile = document.querySelector('.gallery-mobile');

if (galleryMobile && gallery) {
  const slideEls = Array.from(gallery.querySelectorAll('.gallery__slide'));
  const quoteEl = galleryMobile.querySelector('.gallery-mobile__quote');
  const track = galleryMobile.querySelector('.gallery-mobile__track');
  const list = galleryMobile.querySelector('.gallery-mobile__list');
  const fill = galleryMobile.querySelector('.gallery-mobile__indicator-fill');

  const testimonials = slideEls.map((slide) => ({
    quote: slide.querySelector('.index-card__quote p').textContent,
    author: slide.querySelector('.index-card__author').textContent,
  }));

  const cards = [];
  slideEls.forEach((slide, slideIndex) => {
    slide.querySelectorAll('.polaroid').forEach((polaroid) => {
      const card = polaroid.cloneNode(true);
      card.classList.add('gallery-mobile__card');
      card.removeAttribute('tabindex');
      const date = card.querySelector('.polaroid__date');
      if (date) date.remove();

      const li = document.createElement('li');
      li.className = 'gallery-mobile__item';
      li.dataset.group = String(slideIndex);
      li.appendChild(card);
      list.appendChild(li);
      cards.push(li);
    });
  });

  function setGroup(index) {
    const testimonial = testimonials[index];
    quoteEl.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = testimonial.quote;
    const footer = document.createElement('footer');
    footer.textContent = testimonial.author;
    quoteEl.append(p, footer);
  }

  let activeGroup = -1;

  function updateFromScroll() {
    if (cards.length < 2) return;
    const first = cards[0].getBoundingClientRect();
    const second = cards[1].getBoundingClientRect();
    const stride = second.left - first.left;
    if (!stride) return; // the track is hidden (desktop width) — nothing to measure

    const index = Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / stride)));

    fill.style.width = `${((index + 1) / cards.length) * 100}%`;

    const group = Number(cards[index].dataset.group);
    if (group !== activeGroup) {
      activeGroup = group;
      setGroup(group);
    }
  }

  setGroup(0);
  updateFromScroll();

  let ticking = false;
  track.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateFromScroll();
        ticking = false;
      });
    },
    { passive: true }
  );

  window.addEventListener('resize', updateFromScroll);

  const reduceMotionMobileGallery = window.matchMedia('(prefers-reduced-motion: reduce)');
  track.addEventListener('keydown', (event) => {
    if (cards.length < 2) return;
    const stride = cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      track.scrollBy({ left: -stride, behavior: reduceMotionMobileGallery.matches ? 'auto' : 'smooth' });
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      track.scrollBy({ left: stride, behavior: reduceMotionMobileGallery.matches ? 'auto' : 'smooth' });
    }
  });
}

// Dino drops counted per area of campus. Each area is drawn as heat around one or
// more spots ([longitude, latitude]); an area's drops are shared between its spots.
const DROP_AREAS = [
  { name: 'Memorial Union', drops: 26, spots: [[-121.7495, 38.5424]] },
  { name: 'Silo', drops: 22, spots: [[-121.7532, 38.5386]] },
  { name: 'TLC/Grove', drops: 11, spots: [[-121.754, 38.5387], [-121.7557, 38.5386]] },
  { name: 'Death Star area', drops: 2, spots: [[-121.7473, 38.5431]] }, // Social Sciences & Humanities Building
  { name: 'Library', drops: 7, spots: [[-121.7496, 38.5397]] },
  { name: 'California/Wellman area', drops: 26, spots: [[-121.7531, 38.5413], [-121.7514, 38.5413]] },
  { name: 'Tercero', drops: 4, spots: [[-121.7571, 38.5359]] },
  { name: 'Dutton area', drops: 6, spots: [[-121.7477, 38.5416]] },
  { name: 'Olson', drops: 21, spots: [[-121.7476, 38.54]] },
  { name: 'SCC', drops: 6, spots: [[-121.7516, 38.5395]] },
  { name: 'Physical science area', drops: 10, spots: [[-121.751, 38.5382], [-121.7518, 38.5371]] },
  { name: 'North UCD area', drops: 11, spots: [[-121.7547, 38.5432], [-121.7516, 38.542], [-121.7505, 38.5435]] },
  { name: 'Briggs', drops: 8, spots: [[-121.756, 38.5402]] },
  { name: 'Kleiber/Storer', drops: 2, spots: [[-121.7552, 38.5408], [-121.7546, 38.5408]] },
  { name: 'ARC/Segundo', drops: 4, spots: [[-121.76, 38.543], [-121.7582, 38.545]] },
  { name: 'Downtown', drops: 10, spots: [[-121.7415, 38.5435], [-121.74, 38.5445], [-121.742, 38.545]] },
  { name: 'Arboretum', drops: 4, spots: [[-121.7479, 38.5374], [-121.7498, 38.5357], [-121.7525, 38.5338]] },
  { name: 'Manetti Shrem Museum area', drops: 2, spots: [[-121.7478, 38.5335]] },
];

function addDropHeat(map) {
  const busiest = Math.max(...DROP_AREAS.map((area) => area.drops));

  map.addSource('dino-drops', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: DROP_AREAS.flatMap((area) => area.spots.map((spot) => ({
        type: 'Feature',
        properties: { name: area.name, heat: area.drops / area.spots.length / busiest },
        geometry: { type: 'Point', coordinates: spot },
      }))),
    },
  });

  // Drawn under the map's own labels so street and place names stay readable
  const firstLabel = map.getStyle().layers.find((layer) => layer.type === 'symbol');

  map.addLayer({
    id: 'dino-drops-heat',
    type: 'heatmap',
    source: 'dino-drops',
    paint: {
      'heatmap-weight': ['get', 'heat'],
      'heatmap-intensity': 2.2,
      // Doubles with every zoom level, so each blob covers the same ground (about 150m)
      'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'], 11, 5, 18, 640],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(255, 230, 109, 0)',
        0.06, 'rgba(255, 221, 87, 0.8)',
        0.4, '#ffb347',
        0.7, '#ff7a3d',
        1, '#e63946',
      ],
      // See-through, and more so when zoomed in, so the map underneath stays readable
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 17, 0.3],
    },
  }, firstLabel && firstLabel.id);
}

// Campus places named on the map, most important first: when two names would
// overlap, the earlier one is kept and the other appears once zoomed in.
const CAMPUS_LABELS = [
  { name: 'Memorial Union', at: [-121.7495, 38.5424] },
  { name: 'Silo', at: [-121.7532, 38.5386] },
  { name: 'Shields Library', at: [-121.7496, 38.5397] },
  { name: 'Olson Hall', at: [-121.7476, 38.54] },
  { name: 'Wellman Hall', at: [-121.7514, 38.5413] },
  { name: 'California Hall', at: [-121.7531, 38.5413] },
  { name: 'ARC', at: [-121.76, 38.543] },
  { name: 'Tercero', at: [-121.7571, 38.5359] },
  { name: 'Segundo', at: [-121.7582, 38.545] },
  { name: 'Arboretum', at: [-121.7525, 38.5338] },
  { name: 'Mondavi Center', at: [-121.7492, 38.5344] },
  { name: 'Manetti Shrem Museum', at: [-121.7478, 38.5335] },
  { name: 'Social Sciences & Humanities', at: [-121.7473, 38.5431] },
  { name: 'Teaching & Learning Complex', at: [-121.754, 38.5387] },
  { name: 'Student Community Center', at: [-121.7516, 38.5395] },
  { name: 'Briggs Hall', at: [-121.756, 38.5402] },
  { name: 'Dutton Hall', at: [-121.7477, 38.5416] },
  { name: 'Chemistry', at: [-121.751, 38.5382] },
  { name: 'Cruess Hall', at: [-121.7547, 38.5432] },
  { name: 'Wickson Hall', at: [-121.7516, 38.542] },
  { name: 'Hunt Hall', at: [-121.7505, 38.5435] },
  { name: 'The Grove', at: [-121.7557, 38.5386] },
  { name: 'Kleiber Hall', at: [-121.7552, 38.5408] },
  { name: 'Storer Hall', at: [-121.7546, 38.5408] },
  { name: 'Roessler Hall', at: [-121.7518, 38.5371] },
];

function addCampusLabels(map) {
  map.addSource('campus-labels', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: CAMPUS_LABELS.map((place, rank) => ({
        type: 'Feature',
        properties: { name: place.name, rank },
        geometry: { type: 'Point', coordinates: place.at },
      })),
    },
  });

  // Grey text with a white outline, in keeping with the monochrome map
  map.addLayer({
    id: 'campus-labels',
    type: 'symbol',
    source: 'campus-labels',
    minzoom: 13,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 16, 13],
      'text-max-width': 7,
      'symbol-sort-key': ['get', 'rank'],
    },
    paint: {
      'text-color': '#4d4d4d',
      'text-halo-color': 'rgba(255, 255, 255, 0.9)',
      'text-halo-width': 1.5,
    },
  });
}

// Dino Drop Heatmap: swaps the static picture for a live map (MapLibre, with
// OpenFreeMap tiles) that can be dragged and zoomed in place. The picture stays
// if the map library fails to load or the browser cannot draw it.
const heatmapMap = document.querySelector('.heatmap__map');

if (heatmapMap && window.maplibregl) {
  // The same stretch of campus and downtown Davis as the picture in the design,
  // as [longitude, latitude] of the south-west and north-east corners
  const DAVIS_VIEW = [[-121.7833, 38.5282], [-121.7277, 38.5483]];
  // The phone's map is tall and narrow, so it opens on the campus core instead
  const PHONE_VIEW = { center: [-121.7515, 38.5405], zoom: 13.6 };

  try {
    const map = new maplibregl.Map({
      container: heatmapMap,
      style: 'https://tiles.openfreemap.org/styles/positron',
      ...(phoneLayout.matches ? PHONE_VIEW : { bounds: DAVIS_VIEW }),
      minZoom: 11,
      maxZoom: 18,
      // Plain scrolling keeps moving the page: zooming needs Ctrl (or Cmd) + scroll,
      // and on touch screens the map moves with two fingers
      cooperativeGestures: true,
      // The hint shown on touch screens; mouse users keep the Ctrl/Cmd + scroll one
      locale: { 'CooperativeGesturesHandler.MobileHelpText': 'Use two fingers to move and zoom the map' },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.once('load', () => {
      heatmapMap.classList.add('is-interactive');
      addDropHeat(map);
      addCampusLabels(map);
    });

    // The map credits are links; keep them from opening a new tab
    heatmapMap.addEventListener('click', (event) => {
      const link = event.target.closest('a[target]');
      if (link) link.removeAttribute('target');
    }, { capture: true });
  } catch (error) {
    console.warn('The interactive heatmap could not start; showing the picture instead.', error);
  }
}
