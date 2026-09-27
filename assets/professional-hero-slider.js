(() => {
  'use strict';
  const instances = new WeakMap();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function init(root) {
    if (instances.has(root)) return;
    const slides = [...root.querySelectorAll('.shop-phs__slide')];
    if (!slides.length) return;
    const dots = [...root.querySelectorAll('.shop-phs__dot')];
    const status = root.querySelector('.shop-phs__status');
    let index = 0, timer, startX, hovered = false, focused = false, stopped = false;
    const delay = Number(root.dataset.delay) || 7000;
    const rtl = root.dir === 'rtl';
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    function fitHeight() {
      if (!mobileQuery.matches) { root.style.height = ''; return; }
      const style = getComputedStyle(root);
      const baseHeight = parseFloat(style.getPropertyValue('--phs-mobile-height')) || 560;
      const inner = slides[0].querySelector('.shop-phs__inner');
      const innerStyle = getComputedStyle(inner);
      const padding = parseFloat(innerStyle.paddingTop) + parseFloat(innerStyle.paddingBottom);
      const controlsSpace = dots.length || root.querySelector('.shop-phs__arrow') ? 64 : 0;
      const contentHeight = Math.max(...slides.map(slide => slide.querySelector('.shop-phs__content').scrollHeight));
      root.style.height = `${Math.ceil(Math.max(baseHeight, contentHeight + padding + controlsSpace))}px`;
    }
    function show(next, announce = false) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.toggleAttribute('inert', !active);
      });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
      if (announce && status) status.textContent = `${index + 1} / ${slides.length}`;
      fitHeight();
    }
    function pause() { clearInterval(timer); timer = null; }
    function play() {
      pause();
      if (slides.length > 1 && root.dataset.autoplay === 'true' && !stopped && !hovered && !focused && !document.hidden && !reduced.matches && !window.Shopify?.designMode) {
        timer = setInterval(() => show(index + 1), delay);
      }
    }
    function navigate(next) { stopped = true; pause(); show(next, true); }
    root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => navigate(index + (button.dataset.action === 'next' ? 1 : -1))));
    dots.forEach(dot => dot.addEventListener('click', () => navigate(Number(dot.dataset.slide))));
    root.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.target.closest('input, textarea, select, [contenteditable=true]')) return;
      event.preventDefault();
      navigate(index + ((event.key === 'ArrowRight') !== rtl ? 1 : -1));
    });
    root.addEventListener('pointerdown', event => { if (event.pointerType === 'touch' || event.pointerType === 'pen') startX = event.clientX; }, { passive: true });
    root.addEventListener('pointerup', event => {
      if (startX == null) return;
      const distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) > 45) navigate(index + ((distance < 0) !== rtl ? 1 : -1));
    }, { passive: true });
    root.addEventListener('pointercancel', () => { startX = null; });
    root.addEventListener('mouseenter', () => { if (root.dataset.pauseHover === 'true') { hovered = true; pause(); } });
    root.addEventListener('mouseleave', () => { hovered = false; play(); });
    root.addEventListener('focusin', () => { focused = true; pause(); });
    root.addEventListener('focusout', () => { focused = root.contains(document.activeElement); if (!focused) play(); });
    const visibility = () => play();
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener?.('change', visibility);
    window.addEventListener('resize', fitHeight);
    const observer = window.ResizeObserver ? new ResizeObserver(fitHeight) : null;
    slides.forEach(slide => observer?.observe(slide.querySelector('.shop-phs__content')));
    document.fonts?.ready.then(fitHeight);
    const editorSelect = event => {
      const target = slides.findIndex(slide => slide.dataset.blockId === event.detail.blockId);
      if (target >= 0) { pause(); show(target); }
    };
    document.addEventListener('shopify:block:select', editorSelect);
    const destroy = () => {
      pause(); document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener?.('change', visibility);
      window.removeEventListener('resize', fitHeight);
      observer?.disconnect();
      document.removeEventListener('shopify:block:select', editorSelect);
      document.removeEventListener('shopify:section:unload', unload);
      instances.delete(root);
    };
    const unload = event => { if (event.target.contains(root)) destroy(); };
    document.addEventListener('shopify:section:unload', unload);
    instances.set(root, { destroy });
    show(0); play();
  }
  function scan(scope = document) { scope.querySelectorAll('.shop-phs').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan());
  else scan();
  document.addEventListener('shopify:section:load', event => scan(event.target));
})();
