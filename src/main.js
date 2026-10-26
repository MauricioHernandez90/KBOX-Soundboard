import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import './style.css'
import App from './App.vue'
import es from './locales/es.json'
import en from './locales/en.json'

const saved = (() => {
  try { return localStorage.getItem('kbox_lang') } catch { return null }
})()

export const i18n = createI18n({
  legacy: false,
  locale: saved === 'en' || saved === 'es' ? saved : 'es',
  fallbackLocale: 'es',
  messages: { es, en }
})

createApp(App).use(i18n).mount('#app')
