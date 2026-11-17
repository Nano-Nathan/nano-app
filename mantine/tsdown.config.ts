import { defineConfig } from 'tsdown';
import { globSync } from 'glob';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // One folder per piece under src: `<name>/index.tsx` is its import path
  entry: globSync([
    'src/layout/index.tsx',
    'src/components/*/index.{ts,tsx}',
    'src/pages/*/index.tsx',
  ]),
  // One output file per source file: Next reads `'use client'` per module
  unbundle: true,
  root: 'src',
  format: ['esm'],
  platform: 'neutral',
  // `.js`, not `.mjs`: package.json exports read `.js`
  fixedExtension: false,
  // The root tsconfig.dts.json keeps frontend, components and core in the dts rootDir
  dts: { tsconfig: '../tsconfig.dts.json' },
  outDir: 'build',
  clean: true,
  // Peers stay out of the build, Mantine's CSS too: the consumer's copy
  deps: {
    neverBundle: [
      ...Object.keys(pkg.peerDependencies),
      /^@mantine\//,
      /^@nano-app\/components\//,
      /^react\//,
      /^next\//,
    ],
  },
});
