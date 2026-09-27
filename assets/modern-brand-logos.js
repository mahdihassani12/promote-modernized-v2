(() => {
  if (window.__modernBrandLogosReady) return;
  window.__modernBrandLogosReady = true;
  const instances = new WeakMap();

  function setup(carousel) {
    instances.get(carousel)?.destroy();
    const track = carousel.querySelector('[data-brand-track]');
    const items = track ? [...track.children] : [];
    const previous = carousel.querySelector('[data-brand-prev]');
    const next = carousel.querySelector('[data-brand-next]');
    const dots = carousel.querySelector('[data-brand-dots]');
    if (!track || !previous || !next || !dots || items.length < 2) return;

    const rtl = document.documentElement.dir.toLowerCase() === 'rtl';
    const controller = new AbortController();
    const { signal } = controller;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seconds = Math.max(3, Math.min(8, (Number(carousel.dataset.speed) || 30) / 6));
    const interval = carousel.dataset.autoplay === 'true' && !reducedMotion ? seconds * 1000 : 0;
    let timer;
    let index = 0;
    let observer;
    let visible = true;
    let paused = false;

    carousel.dir = rtl ? 'rtl' : 'ltr';
    track.dir = rtl ? 'rtl' : 'ltr';

    function visibleCount() {
      const width = items[0].getBoundingClientRect().width;
      if (!width || !track.clientWidth) return 1;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return Math.max(1, Math.min(items.length, Math.round((track.clientWidth + gap) / (width + gap))));
    }
    function lastIndex() { return Math.max(0, items.length - visibleCount()); }
    function currentIndex() {
      const edge = rtl ? track.getBoundingClientRect().right : track.getBoundingClientRect().left;
      return items.reduce((best, item, i) => {
        const position = rtl ? item.getBoundingClientRect().right : item.getBoundingClientRect().left;
        const distance = Math.abs(position - edge);
        return distance < best.distance ? { index: i, distance } : best;
      }, { index: 0, distance: Infinity }).index;
    }
    function render() {
      index = Math.min(currentIndex(), lastIndex());
      const count = lastIndex() + 1;
      if (dots.children.length !== count) {
        dots.replaceChildren(...Array.from({ length: count }, (_, i) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'modern-brands-glass__dot';
          dot.setAttribute('aria-label', (carousel.dataset.pageLabel || 'Go to page [number]').replace('[number]', String(i + 1)));
          dot.addEventListener('click', () => goTo(i), { signal });
          return dot;
        }));
      }
      [...dots.children].forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }
    function goTo(target, behavior = 'smooth') {
      index = Math.max(0, Math.min(target, lastIndex()));
      const item = items[index];
      const viewport = track.getBoundingClientRect();
      const rect = item.getBoundingClientRect();
      const delta = rtl ? rect.right - viewport.right : rect.left - viewport.left;
      track.scrollBy({ left: delta, behavior: reducedMotion ? 'instant' : behavior });
      setTimeout(render, behavior === 'smooth' && !reducedMotion ? 400 : 0);
    }
    function move(forward) {
      const target = index + (forward ? 1 : -1);
      const wrap = target > lastIndex() || target < 0;
      goTo(wrap ? (forward ? 0 : lastIndex()) : target, wrap ? 'instant' : 'smooth');
    }
    function stop() { clearInterval(timer); timer = undefined; }
    function start() {
      stop();
      if (interval && !paused && visible && !document.hidden && lastIndex() > 0) timer = setInterval(() => move(true), interval);
    }

    previous.addEventListener('click', () => move(false), { signal });
    next.addEventListener('click', () => move(true), { signal });
    carousel.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.target.matches('input,textarea,select')) return;
      event.preventDefault();
      move(rtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight');
    }, { signal });
    track.addEventListener('scroll', render, { passive: true, signal });
    carousel.addEventListener('pointerenter', () => { paused = true; stop(); }, { signal });
    carousel.addEventListener('pointerleave', () => { paused = false; start(); }, { signal });
    carousel.addEventListener('focusin', () => { paused = true; stop(); }, { signal });
    carousel.addEventListener('focusout', (event) => { if (!carousel.contains(event.relatedTarget)) { paused = false; start(); } }, { signal });
    document.addEventListener('visibilitychange', start, { signal });
    const resize = new ResizeObserver(() => { goTo(index, 'instant'); render(); start(); });
    resize.observe(track);
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
      observer.observe(carousel);
    }
    requestAnimationFrame(() => { goTo(0, 'instant'); render(); start(); });
    instances.set(carousel, { destroy() { stop(); resize.disconnect(); observer?.disconnect(); controller.abort(); } });
  }

  function init(root = document) {
    if (root.matches?.('[data-brand-carousel]')) setup(root);
    root.querySelectorAll?.('[data-brand-carousel]').forEach(setup);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:reorder', () => init());
  document.addEventListener('shopify:section:unload', (event) => {
    event.target.querySelectorAll?.('[data-brand-carousel]').forEach((carousel) => instances.get(carousel)?.destroy());
  });
  document.addEventListener('shopify:block:select', (event) => {
    const carousel = event.target.closest('[data-brand-carousel]');
    if (!carousel) return;
    const card = event.target.closest('.modern-brands-glass__card');
    const index = [...carousel.querySelectorAll('.modern-brands-glass__card')].indexOf(card);
    if (index >= 0) card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
})();
