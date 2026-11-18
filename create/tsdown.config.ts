import { cpSync, renameSync } from 'node:fs';
import { basename } from 'node:path';
import { defineConfig } from 'tsdown';

/** Files of the template that an install or a build writes: an app makes its own */
const GENERATED = /^(node_modules|\.next|pnpm-lock\.yaml|.*\.tsbuildinfo|.*-env\.d\.ts)$/;

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  // `.js`, not `.mjs`: the bin of package.json reads `.js`
  fixedExtension: false,
  outDir: 'build',
  clean: true,
  hooks: {
    // The template beside the command, without what an install writes, and `.gitignore` as
    // `gitignore`: npm leaves every `.gitignore` out of a package
    'build:done': () => {
      cpSync('../template', 'build/template', {
        recursive: true,
        filter: sPath => !GENERATED.test(basename(sPath)),
      });
      renameSync('build/template/.gitignore', 'build/template/gitignore');
    },
  },
});
