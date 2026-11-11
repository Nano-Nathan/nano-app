import { defineConfig } from 'tsdown';
import { globSync } from 'glob';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // One folder per component: `<name>/index.ts` is its import path
  entry: globSync('*/index.ts'),
  // One output file per source file: Next reads `'use client'` per module
  unbundle: true,
  root: '.',
  format: ['esm'],
  platform: 'neutral',
  // `.js`, not `.mjs`: package.json exports read `.js`
  fixedExtension: false,
  // The root tsconfig.dts.json keeps frontend and core in the dts rootDir
  dts: { tsconfig: '../tsconfig.dts.json' },
  outDir: 'build',
  clean: true,
  // Peers stay out of the build: the consumer's copy
  deps: {
    neverBundle: [...Object.keys(pkg.peerDependencies), /^react\//, /^next\//],
  },
});
