import { defineConfig } from 'tsdown';
import { globSync } from 'glob';

export default defineConfig({
  // One folder per component: `<name>/index.ts` is its import path (`@nano-app/components/<name>`)
  entry: globSync('*/index.ts', { ignore: ['node_modules/**', 'build/**', 'tests/**'] }),
  // One output file per source file, like the frontend: Next reads `'use client'` per module
  unbundle: true,
  root: '.',
  format: ['esm'],
  platform: 'neutral',
  // `.js`, not `.mjs`: package.json exports read `.js`
  fixedExtension: false,
  // The root tsconfig.dts.json keeps the frontend and core sources inside the dts rootDir
  dts: { tsconfig: '../tsconfig.dts.json' },
  outDir: 'build',
  clean: true,
  // The frontend and React are peers: the consumer's copy, so the views share its provider
  deps: {
    neverBundle: ['@nano-app/frontend', 'react', /^react\//],
  },
});
