/* Keep the theme's own selection/fetch/cart handlers and add keyboard support. */
(() => {
  document.addEventListener('keydown', (event) => {
    const swatch = event.target.closest('hdt-swatch-card[data-card-color], hdt-slider-thumb [data-gallery-thumbnail]');
    if (!swatch || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    swatch.click();
  });
  document.addEventListener('click', (event) => {
    const swatch = event.target.closest('hdt-swatch-card[data-card-color]');
    if (!swatch) return;
    queueMicrotask(() => {
      swatch.closest('.hdt-variants-list')?.querySelectorAll('[data-card-color]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item.parentElement.classList.contains('active')));
      });
    });
  });
})();
