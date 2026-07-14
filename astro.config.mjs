import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://mintyly.github.io',
  integrations: [icon()],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'dracula', // or 'github-dark', etc.
    },
  },
});
