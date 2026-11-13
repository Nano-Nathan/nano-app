import { defineConfig } from 'tsdown';
import { globSync } from 'glob';

export default defineConfig({
  // One folder per plugin: `<name>/index.ts` is its import path
  entry: globSync(['*/index.ts'], {
    ignore: ['node_modules/**', 'build/**', 'tests/**'],
  }),
  // One output file per source file: each plugin keeps its own files
  unbundle: true,
  root: '.',
  format: ['esm'],
  platform: 'node',
  // `.js`, not `.mjs`: the exports read `.js`
  fixedExtension: false,
  // Types only for the import paths
  // The root tsconfig.dts.json keeps backend and core in the dts rootDir
  dts: { entry: ['*/index.ts'], tsconfig: '../tsconfig.dts.json' },
  outDir: 'build',
  clean: true,
  // The backend and Drizzle are peers: the consumer's copies, never bundled ones
  deps: {
    neverBundle: ['@nano-app/backend', /^drizzle-orm/],
  },
});
