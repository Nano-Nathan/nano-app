import { defineConfig } from 'tsdown';
import { globSync } from 'glob';

export default defineConfig({
  // One folder per plugin: `<name>/index.ts` is its import path
  // Routes are loaded from `routesDir` at runtime, so each one is its own file
  entry: globSync(['*/index.ts', '*/routes/**/*.route.ts'], {
    ignore: ['node_modules/**', 'build/**', 'tests/**'],
  }),
  // One output file per source file: each plugin stays next to its routes/
  unbundle: true,
  root: '.',
  format: ['esm'],
  platform: 'node',
  // `.js`, not `.mjs`: the exports and the route loader read `.js`
  fixedExtension: false,
  // Types only for the import paths: routes are never imported
  // The root tsconfig.dts.json keeps backend and core in the dts rootDir
  dts: { entry: ['*/index.ts'], tsconfig: '../tsconfig.dts.json' },
  outDir: 'build',
  clean: true,
  // The backend and Drizzle are peers: the consumer's copies, never bundled ones
  deps: {
    neverBundle: ['@nano-app/backend', /^drizzle-orm/],
  },
});
