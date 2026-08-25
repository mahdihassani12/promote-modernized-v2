(() => {
  const resetDocumentX = () => {
    if (window.matchMedia('(max-width: 749px)').matches) {
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
    }
  };

  const init = (root = document) => {
    root.querySelectorAll('[data-modern-carousel]').forEach((carousel) => {
      if (carousel.dataset.modernReady === 'true') return;
      const track = carousel.querySelector('[data-modern-track]');
      const prev = carousel.querySelector('[data-modern-prev]');
      const next = carousel.querySelector('[data-modern-next]');
      const dots = carousel.querySelector('[data-modern-dots]');
      if (!track || !prev || !next || !dots) return;
      carousel.dataset.modernReady = 'true';
      const isRtl = document.documentElement.dir === 'rtl';
      let rtlScrollType = 'negative';
      if (isRtl) {
        track.scrollLeft = 1;
        rtlScrollType = track.scrollLeft === 0 ? 'negative' : 'reverse';
        track.scrollLeft = rtlScrollType === 'negative' ? 0 : track.scrollWidth;
      }
      const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
      const logicalScroll = () => {
        if (!isRtl) return track.scrollLeft;
        return rtlScrollType === 'negative' ? -track.scrollLeft : maxScroll() - track.scrollLeft;
      };
      const scrollToPage = (index) => {
        const logicalLeft = Math.min(maxScroll(), index * track.clientWidth);
        const left = !isRtl ? logicalLeft : rtlScrollType === 'negative' ? -logicalLeft : maxScroll() - logicalLeft;
        track.scrollTo({ left, behavior: 'smooth' });
      };
      const pageCount = () => Math.max(1, Math.ceil((track.scrollWidth - 1) / track.clientWidth));
      const activePage = () => Math.min(pageCount() - 1, Math.round(logicalScroll() / track.clientWidth));
      const render = () => {
        const count = pageCount();
        if (dots.children.length !== count) {
          dots.replaceChildren(...Array.from({ length: count }, (_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'modern-carousel__dot';
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dot.addEventListener('click', () => scrollToPage(index));
            return dot;
          }));
        }
        const active = activePage();
        [...dots.children].forEach((dot, index) => dot.classList.toggle('is-active', index === active));
        prev.disabled = logicalScroll() <= 2;
        next.disabled = logicalScroll() >= maxScroll() - 2;
      };
      prev.addEventListener('click', () => scrollToPage(Math.max(0, activePage() - 1)));
      next.addEventListener('click', () => scrollToPage(Math.min(pageCount() - 1, activePage() + 1)));
      track.addEventListener('scroll', render, { passive: true });
      new ResizeObserver(render).observe(track);
      render();
    });
  };
  document.addEventListener('DOMContentLoaded', () => {
    resetDocumentX();
    init();
    requestAnimationFrame(resetDocumentX);
  });
  window.addEventListener('pageshow', resetDocumentX);
  window.addEventListener('orientationchange', () => setTimeout(resetDocumentX, 100));
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
