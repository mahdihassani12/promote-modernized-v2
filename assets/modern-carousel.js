(() => {
  if (window.__modernCarouselLoaded) return;
  window.__modernCarouselLoaded = true;

  const instances = new WeakMap();

  const initCarousel = (carousel) => {
    instances.get(carousel)?.destroy();

    const track = carousel.querySelector('[data-modern-track]');
    const previous = carousel.querySelector('[data-modern-prev]');
    const next = carousel.querySelector('[data-modern-next]');
    const dots = carousel.querySelector('[data-modern-dots]');
    if (!track || !previous || !next || !dots) return;

    const items = [...track.children];
    const isRtl = document.documentElement.lang === 'ar';
    const loops = carousel.dataset.loop === 'true';
    const autoplayDelay = Number(carousel.dataset.autoplay || 0) * 1000;
    const abortController = new AbortController();
    const { signal } = abortController;
    let timer;
    let activeIndex = 0;

    track.dir = isRtl ? 'rtl' : 'ltr';

    const visibleCount = () => {
      if (!items[0]) return 1;
      const itemWidth = items[0].getBoundingClientRect().width;
      return Math.max(1, Math.round(track.clientWidth / itemWidth));
    };

    const lastIndex = () => Math.max(0, items.length - visibleCount());
    const pageIndexes = () => {
      const step = visibleCount();
      const pages = [];
      for (let index = 0; index < items.length; index += step) pages.push(Math.min(index, lastIndex()));
      return [...new Set(pages)];
    };

    const currentIndex = () => {
      const edge = isRtl ? track.getBoundingClientRect().right : track.getBoundingClientRect().left;
      return items.reduce((closest, item, index) => {
        const rect = item.getBoundingClientRect();
        const itemEdge = isRtl ? rect.right : rect.left;
        return Math.abs(itemEdge - edge) < closest.distance
          ? { index, distance: Math.abs(itemEdge - edge) }
          : closest;
      }, { index: 0, distance: Infinity }).index;
    };

    const render = () => {
      activeIndex = Math.min(currentIndex(), lastIndex());
      const pages = pageIndexes();
      if (dots.children.length !== pages.length) {
        dots.replaceChildren(...pages.map((itemIndex, pageIndex) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'modern-carousel__dot';
          dot.setAttribute('aria-label', `Go to page ${pageIndex + 1}`);
          dot.addEventListener('click', () => goTo(itemIndex), { signal });
          return dot;
        }));
      }
      const activePage = pages.reduce((closest, index, page) =>
        Math.abs(index - activeIndex) < closest.distance
          ? { page, distance: Math.abs(index - activeIndex) }
          : closest, { page: 0, distance: Infinity }).page;
      [...dots.children].forEach((dot, index) => dot.classList.toggle('is-active', index === activePage));
      previous.disabled = !loops && activeIndex === 0;
      next.disabled = !loops && activeIndex >= lastIndex();
    };

    const goTo = (index, behavior = 'smooth') => {
      activeIndex = Math.max(0, Math.min(index, lastIndex()));
      items[activeIndex]?.scrollIntoView({ behavior, block: 'nearest', inline: 'start' });
      window.setTimeout(render, behavior === 'smooth' ? 350 : 0);
    };

    const move = (forward) => {
      const step = visibleCount();
      let target = activeIndex + (forward ? step : -step);
      if (loops && target > lastIndex()) target = 0;
      if (loops && target < 0) target = lastIndex();
      goTo(target);
    };

    const stopAutoplay = () => window.clearInterval(timer);
    const startAutoplay = () => {
      stopAutoplay();
      if (autoplayDelay > 0 && items.length > visibleCount()) {
        timer = window.setInterval(() => move(true), autoplayDelay);
      }
    };

    previous.addEventListener('click', () => move(false), { signal });
    next.addEventListener('click', () => move(true), { signal });
    track.addEventListener('scroll', render, { passive: true, signal });
    carousel.addEventListener('pointerenter', stopAutoplay, { signal });
    carousel.addEventListener('pointerleave', startAutoplay, { signal });
    carousel.addEventListener('focusin', stopAutoplay, { signal });
    carousel.addEventListener('focusout', startAutoplay, { signal });
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(track);
    render();
    startAutoplay();

    instances.set(carousel, {
      destroy: () => {
        stopAutoplay();
        resizeObserver.disconnect();
        abortController.abort();
      }
    });
  };

  const init = (root = document) => {
    if (root.matches?.('[data-modern-carousel]')) initCarousel(root);
    root.querySelectorAll?.('[data-modern-carousel]').forEach(initCarousel);
  };

  document.addEventListener('DOMContentLoaded', () => init());
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:reorder', () => init());
  document.addEventListener('shopify:block:select', (event) => {
    const carousel = event.target.closest('[data-modern-carousel]');
    if (!carousel) return;
    initCarousel(carousel);
    event.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
})();
