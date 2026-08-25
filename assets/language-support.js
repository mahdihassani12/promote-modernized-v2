(() => {
  const preferenceKey = 'storefront-language-selected';

  const rememberLanguage = () => {
    document.querySelectorAll('[data-language-option]').forEach((option) => {
      option.addEventListener('click', () => {
        window.localStorage.setItem(preferenceKey, option.value);
      });
    });
  };

  const useArabicByDefault = () => {
    const form = document.getElementById('HeaderLanguageForm');
    if (!form || document.documentElement.lang.toLowerCase().startsWith('ar')) return;
    if (window.localStorage.getItem(preferenceKey)) return;

    window.localStorage.setItem(preferenceKey, 'ar');
    const locale = document.createElement('input');
    locale.type = 'hidden';
    locale.name = 'locale_code';
    locale.value = 'ar';
    form.append(locale);
    form.submit();
  };

  document.addEventListener('DOMContentLoaded', () => {
    rememberLanguage();
    useArabicByDefault();
  });
})();
