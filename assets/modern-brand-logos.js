(() => {
  if (window.__modernBrandLogosReady) return;
  window.__modernBrandLogosReady = true;
  const instances = new WeakMap();

  function setup(carousel) {
    instances.get(carousel)?.destroy();
    const track = carousel.querySelector('[data-brand-track]');
    const originals = track ? [...track.children] : [];
    const previous = carousel.querySelector('[data-brand-prev]');
    const next = carousel.querySelector('[data-brand-next]');
    const dots = carousel.querySelector('[data-brand-dots]');
    if (!track || !previous || !next || !dots || originals.length < 2) return;

    const count = originals.length;
    const rtl = document.documentElement.dir.toLowerCase() === 'rtl' || /^ar\b/i.test(document.documentElement.lang);
    const controller = new AbortController();
    const { signal } = controller;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = carousel.dataset.autoplay === 'true' && !reducedMotion ? 5000 : 0;
    let position = count;
    let timer;
    let settleTimer;
    let observer;
    let visible = true;

    carousel.dir = rtl ? 'rtl' : 'ltr';
    track.dir = rtl ? 'rtl' : 'ltr';

    const clone = (item) => {
      const copy = item.cloneNode(true);
      copy.setAttribute('data-brand-clone', '');
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('tabindex', '-1');
      copy.removeAttribute('data-shopify-editor-block');
      return copy;
    };
    const before = document.createDocumentFragment();
    const after = document.createDocumentFragment();
    originals.forEach((item) => {
      before.appendChild(clone(item));
      after.appendChild(clone(item));
    });
    track.prepend(before);
    track.append(after);
    const cards = [...track.children];

    const logicalIndex = (index) => ((index - count) % count + count) % count;
    function nearestIndex() {
      const edge = rtl ? track.getBoundingClientRect().right : track.getBoundingClientRect().left;
      return cards.reduce((best, item, index) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs((rtl ? rect.right : rect.left) - edge);
        return distance < best.distance ? { index, distance } : best;
      }, { index: count, distance: Infinity }).index;
    }
    function render() {
      const active = logicalIndex(nearestIndex());
      [...dots.children].forEach((dot, index) => {
        dot.classList.toggle('is-active', index === active);
        if (index === active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }
    function scrollToPosition(index, behavior = 'smooth') {
      position = index;
      const rect = cards[index].getBoundingClientRect();
      const viewport = track.getBoundingClientRect();
      const delta = rtl ? rect.right - viewport.right : rect.left - viewport.left;
      track.scrollBy({ left: delta, behavior: reducedMotion ? 'instant' : behavior });
      if (behavior === 'instant' || reducedMotion) render();
    }
    function settle() {
      clearTimeout(settleTimer);
      position = nearestIndex();
      if (position < count || position >= count * 2) {
        // The matching real card has identical neighbours on both sides.
        // Reposition after the edge clone finishes moving, without a visible jump.
        scrollToPosition(count + logicalIndex(position), 'instant');
      }
      render();
    }
    function move(forward) {
      clearTimeout(settleTimer);
      if (forward && position >= count * 2) scrollToPosition(count + logicalIndex(position), 'instant');
      const target = Math.max(0, Math.min(cards.length - 1, position + (forward ? 1 : -1)));
      scrollToPosition(target);
      settleTimer = setTimeout(settle, reducedMotion ? 0 : 500);
    }
    function stop() { clearInterval(timer); timer = undefined; }
    function start() {
      if (!interval || !visible || document.hidden) { stop(); return; }
      if (!timer) timer = setInterval(() => move(true), interval);
    }

    dots.replaceChildren(...originals.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'modern-brands-glass__dot';
      dot.setAttribute('aria-label', (carousel.dataset.pageLabel || 'Go to page [number]').replace('[number]', String(index + 1)));
      dot.addEventListener('click', () => {
        clearTimeout(settleTimer);
        scrollToPosition(count + index);
        settleTimer = setTimeout(settle, reducedMotion ? 0 : 500);
      }, { signal });
      return dot;
    }));
    previous.addEventListener('click', () => move(false), { signal });
    next.addEventListener('click', () => move(true), { signal });
    carousel.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.target.matches('input,textarea,select')) return;
      event.preventDefault();
      move(rtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight');
    }, { signal });
    track.addEventListener('scroll', () => {
      render();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 180);
    }, { passive: true, signal });
    document.addEventListener('visibilitychange', start, { signal });
    const resize = new ResizeObserver(() => {
      clearTimeout(settleTimer);
      scrollToPosition(count + logicalIndex(position), 'instant');
      start();
    });
    resize.observe(track);
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
      observer.observe(carousel);
    }
    requestAnimationFrame(() => {
      scrollToPosition(count, 'instant');
      render();
      start();
      if (interval && visible && !document.hidden) requestAnimationFrame(() => move(true));
    });
    instances.set(carousel, {
      destroy() {
        stop();
        clearTimeout(settleTimer);
        resize.disconnect();
        observer?.disconnect();
        controller.abort();
        track.querySelectorAll('[data-brand-clone]').forEach((item) => item.remove());
      }
    });
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
    const card = event.target.closest('.modern-brands-glass__card:not([data-brand-clone])');
    if (card) card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
})();
