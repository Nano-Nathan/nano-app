import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitepress';

/** Documentation site, built from the READMEs of the repository */
export default defineConfig({
  title: 'nano-app',
  description: 'File-convention framework for Node.js',
  srcDir: '..',
  srcExclude: ['.claude/**', 'core/**', 'features/**', '**/node_modules/**'],
  vite: {
    resolve: { alias: { vue: fileURLToPath(new URL('../node_modules/vue', import.meta.url)) } },
  },
  rewrites: { 'README.md': 'index.md' },
  themeConfig: {
    nav: [{ text: 'GitHub', link: 'https://github.com/Nano-Nathan/nano-app' }],
    sidebar: [
      { text: 'Introduction', link: '/' },
      {
        text: 'Packages',
        items: [
          { text: 'Backend', link: '/backend/README' },
          { text: 'Plugins', link: '/plugins/README' },
          { text: 'Frontend', link: '/frontend/README' },
          { text: 'Components', link: '/components/README' },
        ],
      },
      {
        text: 'Project',
        items: [
          { text: 'Contributing', link: '/CONTRIBUTING' },
          { text: 'Security', link: '/SECURITY' },
        ],
      },
    ],
    search: { provider: 'local' },
  },
});
