import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  entry: ['src/index.ts', 'src/next.ts'],
  // One output file per source file: Next reads the `'use client'` and `'use server'` directives
  // per module, and a bundle would merge (and drop) them
  unbundle: true,
  root: 'src',
  format: ['esm'],
  platform: 'neutral',
  // `.js`, not `.mjs`: package.json exports read `.js`
  fixedExtension: false,
  // The root tsconfig.dts.json keeps the core sources inside the dts rootDir
  dts: { tsconfig: '../tsconfig.dts.json' },
  outDir: 'build',
  clean: true,
  // Dependencies and peers stay out of the build; the types of @nano-app/core go in
  deps: {
    neverBundle: [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
      /^react\//,
      /^next\//,
    ],
  },
});
