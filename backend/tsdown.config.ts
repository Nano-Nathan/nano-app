import { existsSync } from 'node:fs';
import { defineConfig } from 'tsdown';
import { globSync } from 'glob';
import pkg from './package.json' with { type: 'json' };

// Official plugins are optional. This tree ships none; a plugins/index.ts turns the export on.
const pluginEntry = existsSync('plugins/index.ts') ? { plugins: 'plugins/index.ts' } : {};

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'nano-app': 'bin/nano-app.ts',
    ...pluginEntry,
    ...Object.fromEntries(
      globSync('plugins/*/routes/**/*.route.ts').map(route => [route.replace(/\.ts$/, ''), route]),
    ),
  },
  format: ['esm'],
  platform: 'node',
  // `.js`, not `.mjs`: package.json exports and the route loader (`*.route.{ts,js}`) read `.js`
  fixedExtension: false,
  // Types only for the import paths, not for the CLI. The root tsconfig.dts.json keeps core/ inside the dts rootDir
  dts: { entry: ['src/index.ts', ...Object.values(pluginEntry)], tsconfig: '../tsconfig.dts.json' },
  outDir: 'build',
  clean: true,
  // Dependencies and optional peers (the Prisma stack) stay out of the bundle; @nano-app/core goes in
  deps: {
    neverBundle: [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ],
  },
});
