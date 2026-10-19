#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { OFFICIAL_PLUGINS } from '../const';
import Prisma from '../src/database/Prisma';

/**
 * Generates a Prisma client where nano-app reads it, as the startup does: for the build or the editor.
 *   nano-app generate                     the app's schema (src/prisma/schema.prisma)
 *   nano-app generate <name>              an official plugin's, from the installed @nano-app/plugins
 *   nano-app generate <name> --schema <path>
 */
const [sCommand, ...aArgs] = process.argv.slice(2);

/** package.json of @nano-app/plugins: the project itself (its tests) or one in a node_modules */
function officialPackage(): string | undefined {
  // Walks up from the project to the filesystem root
  for (let sDir = process.cwd(); ; sDir = dirname(sDir)) {
    // Checks the project's own package
    const sOwn = join(sDir, 'package.json');
    if (existsSync(sOwn) && JSON.parse(readFileSync(sOwn, 'utf-8')).name === OFFICIAL_PLUGINS) {
      return sOwn;
    }

    // Checks the installed one
    const sInstalled = join(sDir, 'node_modules', OFFICIAL_PLUGINS, 'package.json');
    if (existsSync(sInstalled)) return sInstalled;

    // Stops at the root
    if (dirname(sDir) === sDir) return undefined;
  }
}

/** Schema of an official plugin: next to the entry @nano-app/plugins exports for it */
function pluginSchema(sName: string): string {
  // Finds the package
  const sPackage = officialPackage();
  if (!sPackage) return `${OFFICIAL_PLUGINS} is not installed`;

  // The target of "./*" (its "import" or "default" condition), with the plugin's name
  const oExport = JSON.parse(readFileSync(sPackage, 'utf-8')).exports['./*'];
  const sTarget = oExport.import ?? oExport.default;
  return join(dirname(sPackage), dirname(sTarget.replace('*', sName)), 'schema.prisma');
}

try {
  // Only generate: migrations are Prisma's
  if (sCommand !== 'generate') {
    throw new Error('[nano-app] [ERROR] Usage: nano-app generate [name] [--schema <path>]');
  }

  // The name and its schema
  const iSchemaFlag = aArgs.indexOf('--schema');
  const sSchemaFlag = iSchemaFlag >= 0 ? aArgs[iSchemaFlag + 1] : undefined;
  const fnIsFlagPart = (iIndex: number): boolean =>
    iSchemaFlag >= 0 && (iIndex === iSchemaFlag || iIndex === iSchemaFlag + 1);
  const sName = aArgs.find((_sArg, iIndex) => !fnIsFlagPart(iIndex));
  const sDefault = sName ? pluginSchema(sName) : 'src/prisma/schema.prisma';
  const sSchema = sSchemaFlag ?? sDefault;

  // Checks that the schema exists
  if (!existsSync(sSchema)) {
    throw new Error(`[nano-app] [ERROR] "${sName ?? 'app'}" has no schema: ${sSchema}`);
  }

  // Generates it
  Prisma.generate(sName ?? 'app', sSchema);
} catch (oError) {
  console.error((oError as Error).message);
  process.exit(1);
}
