import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

/** Documentation site, built from docs/ of the repository */
export default defineConfig({
  title: 'Nano-App',
  description: 'Full-stack apps from files in the right folders: Express 5, Next.js and Mantine',
  srcDir: '../docs',
  cleanUrls: true,
  lastUpdated: true,
  vite: {
    plugins: [llmstxt()],
    resolve: { alias: { vue: fileURLToPath(new URL('../node_modules/vue', import.meta.url)) } },
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-icon.png' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Tutorial', link: '/tutorial/' },
      { text: 'Guides', link: '/guides/permissions' },
      { text: 'Catalog', link: '/catalog/' },
      { text: 'Reference', link: '/reference/backend' },
      { text: 'Concepts', link: '/concepts/architecture' },
    ],
    sidebar: {
      '/tutorial/': [
        {
          text: 'Tutorial',
          items: [
            { text: 'Overview', link: '/tutorial/' },
            { text: '1. Create the app', link: '/tutorial/create-the-app' },
            { text: '2. Store notes', link: '/tutorial/store-notes' },
            { text: '3. Show and add notes', link: '/tutorial/show-notes' },
            { text: '4. Sign in', link: '/tutorial/sign-in' },
          ],
        },
      ],
      '/guides/': [
        {
          text: 'Backend',
          items: [
            { text: 'Ask for permissions', link: '/guides/permissions' },
            { text: 'Validate crud bodies', link: '/guides/validate-crud' },
            { text: 'Apply schema changes', link: '/guides/migrations' },
            { text: 'Write a plugin', link: '/guides/write-a-plugin' },
          ],
        },
        {
          text: 'Frontend',
          items: [
            { text: 'Texts and languages', link: '/guides/texts-and-locales' },
            { text: 'Sign in with Google', link: '/guides/social-login' },
            { text: 'Change a ready controller', link: '/guides/extend-a-controller' },
            { text: 'Use a second backend', link: '/guides/second-backend' },
            { text: 'Keep a proxy of your own', link: '/guides/own-proxy' },
          ],
        },
        { text: 'Operations', items: [{ text: 'Deploy', link: '/guides/deploy' }] },
      ],
      '/catalog/': [
        {
          text: 'Catalog',
          items: [
            { text: 'Overview', link: '/catalog/' },
            { text: 'Plugins', link: '/catalog/plugins' },
            { text: 'Controllers', link: '/catalog/controllers' },
            { text: 'Mantine', link: '/catalog/mantine' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Backend',
          items: [
            { text: '@nano-app/backend', link: '/reference/backend' },
            { text: '@nano-app/plugins', link: '/reference/plugins' },
          ],
        },
        {
          text: 'Frontend',
          items: [
            { text: '@nano-app/frontend', link: '/reference/frontend' },
            { text: '@nano-app/controllers', link: '/reference/controllers' },
            { text: '@nano-app/mantine', link: '/reference/mantine' },
          ],
        },
        { text: 'Tooling', items: [{ text: '@nano-app/create', link: '/reference/create' }] },
      ],
      '/concepts/': [
        {
          text: 'Concepts',
          items: [
            { text: 'Architecture', link: '/concepts/architecture' },
            { text: 'Conventions', link: '/concepts/conventions' },
            { text: 'Backend lifecycle', link: '/concepts/backend-lifecycle' },
            { text: 'State and controllers', link: '/concepts/frontend-state' },
            { text: 'Security model', link: '/concepts/security' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Nano-Nathan/nano-app' }],
    editLink: {
      pattern: 'https://github.com/Nano-Nathan/nano-app/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: { message: 'Released under the MIT License.', copyright: '© Cristian Serrano' },
    outline: 'deep',
    search: { provider: 'local' },
  },
});
