import { dirname } from 'node:path';
import { defineConfig } from 'tsdown';
import { globSync } from 'glob';

export default defineConfig({
  // One folder per plugin: `<name>/index.ts` is its import path (`@nano-app/plugins/<name>`).
  // Routes are loaded from `routesDir` at runtime, so each one is its own file
  entry: globSync(['*/index.ts', '*/routes/**/*.route.ts'], {
    ignore: ['node_modules/**', 'build/**', 'tests/**'],
  }),
  // One output file per source file, under its plugin folder: `import.meta.url` of each plugin stays next to its routes/
  unbundle: true,
  root: '.',
  format: ['esm'],
  platform: 'node',
  // `.js`, not `.mjs`: package.json exports and the route loader (`*.route.{ts,js}`) read `.js`
  fixedExtension: false,
  // Types only for the import paths; routes are loaded at runtime, never imported.
  // The root tsconfig.dts.json keeps the backend and core sources inside the dts rootDir
  dts: { entry: ['*/index.ts'], tsconfig: '../tsconfig.dts.json' },
  outDir: 'build',
  // A plugin's Prisma schema and its migrations sit next to its index.js, where nano-app looks for them
  copy: globSync(['*/schema.prisma', '*/migrations']).map(file => ({
    from: file,
    to: `build/${dirname(file)}`,
  })),
  clean: true,
  // The backend is a peer: the consumer's copy, never a bundled one
  deps: {
    neverBundle: ['@nano-app/backend'],
  },
});
