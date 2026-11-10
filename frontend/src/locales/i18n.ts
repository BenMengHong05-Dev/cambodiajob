import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en/translation.json'
import km from './km/translation.json'

const savedLanguage = localStorage.getItem('app_language') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      km: { translation: km },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

