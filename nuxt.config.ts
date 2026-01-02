// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vueuse/nuxt', '@vite-pwa/nuxt', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  router: {
    options: {
      hashMode: true,
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico'],
    manifest: {
      name: 'Todo PWA',
      short_name: 'Todo',
      description: 'Offline-first Todo App',
      theme_color: '#ffffff',
      icons: [],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    },
  },
})
