/* ============================================================
   Scroll-reveal — fade + rise as content enters the viewport
   Shared across every page. A page only needs:

       <script src="reveal.js" defer></script>

   and class="reveal" on whatever content blocks (section headers,
   card grids, CTA banners, etc.) should fade in as the user
   scrolls to them — see styles.css for the .js .reveal rules this
   drives. Ported from the Rules page's own inline copy of this
   same mechanism; kept as one shared file so every other page
   (home included, once it's built) animates identically instead
   of drifting out of sync with separately-tuned copies.
============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  reveals.forEach(function (el) { io.observe(el); });
})();
