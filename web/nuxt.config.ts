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
    pageTransition: { name: 'fade', mode: 'out-in' },
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
      },
    },
  },
  ui: {
    theme: {
      defaultVariants: {
        size: 'xl',
      },
    },
  },
  nitro: {
    minify: true,
    preset: 'static',
    prerender: {
      routes: ['/'],
    },
  },
  icon: {
    provider: 'none',
    clientBundle: {
      scan: {
        globInclude: [
          'app/components/**/*.vue',
          'app/pages/**/*.vue',
          'app/app.config.ts',
        ],
      },
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
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff}'],
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
