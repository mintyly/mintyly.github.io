import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://june.ong',
  redirects: {
    '/blog/how-to-train-your-mythos': '/blog/how-overwatch-landed-me-a-security-conference-talk-on-autonomous-red-teaming-agents/',
  },
  integrations: [icon()],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'dracula', // or 'github-dark', etc.
    },
  },
});
