// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://brembo-tempo-tours.netlify.app',
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'sv',
    locales: ['sv', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
});