// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Set `site` when the production domain is known (canonical URLs, sitemap).
  build: { inlineStylesheets: 'auto' },
});
