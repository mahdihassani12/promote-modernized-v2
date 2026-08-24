(() => {
  const init = (root = document) => {
    root.querySelectorAll('[data-modern-carousel]').forEach((carousel) => {
      if (carousel.dataset.modernReady === 'true') return;
      const track = carousel.querySelector('[data-modern-track]');
      const prev = carousel.querySelector('[data-modern-prev]');
      const next = carousel.querySelector('[data-modern-next]');
      const dots = carousel.querySelector('[data-modern-dots]');
      if (!track || !prev || !next || !dots) return;
      carousel.dataset.modernReady = 'true';
      const pageCount = () => Math.max(1, Math.ceil((track.scrollWidth - 1) / track.clientWidth));
      const activePage = () => Math.min(pageCount() - 1, Math.round(track.scrollLeft / track.clientWidth));
      const render = () => {
        const count = pageCount();
        if (dots.children.length !== count) {
          dots.replaceChildren(...Array.from({ length: count }, (_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'modern-carousel__dot';
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dot.addEventListener('click', () => track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' }));
            return dot;
          }));
        }
        const active = activePage();
        [...dots.children].forEach((dot, index) => dot.classList.toggle('is-active', index === active));
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      };
      prev.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
      next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }));
      track.addEventListener('scroll', render, { passive: true });
      new ResizeObserver(render).observe(track);
      render();
    });
  };
  document.addEventListener('DOMContentLoaded', () => init());
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
