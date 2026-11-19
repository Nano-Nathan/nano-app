import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // Two entries: the views from `@nano-app/mantine`, the layouts and pages from `/server`
  entry: ['src/index.ts', 'src/server.ts'],
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
      /^@nano-app\/frontend\//,
      /^react\//,
      /^next\//,
    ],
  },
});
