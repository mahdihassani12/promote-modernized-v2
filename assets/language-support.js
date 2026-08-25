(() => {
  const preferenceKey = 'storefront-language-selected';

  const rememberLanguage = () => {
    document.querySelectorAll('[data-language-option]').forEach((option) => {
      option.addEventListener('click', () => {
        window.localStorage.setItem(preferenceKey, option.value);
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    rememberLanguage();
  });
})();
