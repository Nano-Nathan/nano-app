#!/usr/bin/env node
import { resolve } from 'node:path';
import { createJiti } from 'jiti';
import { migrate } from './migrate';
import type { PluginConfig } from '@nano-app/backend';
import type { Auth } from '../types/auth';

/**
 * Manual migrations of the auth plugin (they never run at startup):
 *   nano-app-auth migrate [file]
 * `file` default-exports the configured plugin, `auth({ ... })`. Defaults to src/auth.ts
 */
const [sCommand, sFile = 'src/auth.ts'] = process.argv.slice(2);

// Checks the command
if (sCommand !== 'migrate') {
  console.error('Usage: nano-app-auth migrate [file]   (file default-exports auth({ ... }))');
  process.exit(1);
}

// Loads the plugin from the consumer's file. Its import of @nano-app/backend loads the .env
const oPlugin = await createJiti(import.meta.url).import<PluginConfig<{ auth: Auth }>>(
  resolve(sFile),
  { default: true },
);
if (oPlugin?.name !== 'auth' || !oPlugin.options) {
  console.error(
    `[nano-app] [ERROR] ${sFile} does not default-export the auth plugin: export default auth({ ... }).`,
  );
  process.exit(1);
}

// Migrates, and closes the pool even when it fails
const oAuth = oPlugin.options.auth;
try {
  const aChanges = await migrate(oAuth);
  console.log(
    aChanges.map(sChange => `[nano-app] [INFO] auth: ${sChange}`).join('\n') ||
      '[nano-app] [INFO] auth: up to date',
  );
} finally {
  await (oAuth.options.database as unknown as { end: () => Promise<void> }).end();
}
