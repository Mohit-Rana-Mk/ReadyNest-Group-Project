import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';
import paTranslation from './locales/pa.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  pa: { translation: paTranslation }
};

// Custom language detection logic:
// 1. Logged-in user's preference (stored in localStorage under 'user_lang' or fetched from token)
// 2. Local Storage
// 3. Browser language
// 4. Default to 'en'
const getSavedLanguage = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.language) return user.language;
    } catch (e) {}
  }
  
  const localLang = localStorage.getItem('i18nextLng');
  if (localLang && ['en', 'hi', 'pa'].includes(localLang)) {
    return localLang;
  }
  
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang) {
    const code = browserLang.split('-')[0];
    if (['en', 'hi', 'pa'].includes(code)) return code;
  }
  
  return 'en';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'pa'],
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Handle text direction (RTL/LTR) LTR is default, but if we add Urdu/Arabic in future it will update
i18n.on('languageChanged', (lng) => {
  const dir = ['ur', 'ar', 'he'].includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

export default i18n;
