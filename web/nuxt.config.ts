// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vueuse/nuxt', '@pinia/nuxt', '@vite-pwa/nuxt'],
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
      link: [
        {
          rel: 'icon',
          href: '/favicon.ico',
          sizes: '48x48',
        },
        {
          rel: 'icon',
          href: '/favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
        },
        {
          rel: 'apple-touch-icon',
          href: '/apple-touch-icon-180x180.png',
        },
      ],
    },
  },
  vite: {
    logLevel: 'info',
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.SERVER_PORT ?? '3000'}`,
          changeOrigin: true,
        },
      }
    }
  },
  nitro: {
    minify: true,
    prerender: {
      routes: ['/'],
    },
  },
  pwa: {
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    pwaAssets: {
      config: false,
      image: 'favicon.svg',
      preset: 'minimal-2023',
    },
    manifest: {
      name: 'mscx',
      short_name: 'mscx',
      theme_color: '#000000',
      scope: '/',
      display: 'standalone',
      id: '/',
      orientation: 'portrait',
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackAllowlist: [/^\//],
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    },
  },
})
