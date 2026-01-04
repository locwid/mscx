// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vueuse/nuxt', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  router: {
    options: {
      hashMode: true,
    },
  },
  app: {
    head: {
      title: 'mscx',
    },
  },
})
