#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import 'dotenv/config';
import { MISSING_DATABASE_URL, OFFICIAL_PLUGINS } from '../const';

/**
 * Prisma wrapper: clients are generated in .nano-app/prisma-clients/<name>. "app" is the project's
 * schema; any other name is an official plugin's, read from the installed @nano-app/plugins.
 *   nano-app generate [name...] [--schema <path>]
 *   nano-app push [name...] [--schema <path>] [prisma flags, e.g. --accept-data-loss]
 *   nano-app <any other Prisma command>
 */
const [sCommand, ...aArgs] = process.argv.slice(2);

/** Resolves packages from the consumer's project */
const oRequire = createRequire(`${process.cwd()}/`);

// Runs the consumer's Prisma CLI
const fnPrisma = (...aPrismaArgs: string[]): Buffer =>
  execFileSync(process.execPath, [oRequire.resolve('prisma/build/index.js'), ...aPrismaArgs], {
    stdio: 'inherit',
  });

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
  // Any other command goes straight to Prisma
  if (sCommand !== 'generate' && sCommand !== 'push') {
    fnPrisma(...process.argv.slice(2));
  } else {
    // Splits the app schema, the plugin names and the Prisma flags
    const iSchemaFlag = aArgs.indexOf('--schema');
    const sAppSchema =
      iSchemaFlag >= 0 ? aArgs.splice(iSchemaFlag, 2)[1] : 'src/prisma/schema.prisma';
    const aNames = aArgs.filter(sArg => !sArg.startsWith('-'));
    const aFlags = aArgs.filter(sArg => sArg.startsWith('-'));

    // Checks that push has a database to push to
    const sUrl = process.env.DATABASE_URL;
    if (sCommand === 'push' && !sUrl) {
      console.error(MISSING_DATABASE_URL);
      process.exit(1);
    }

    for (const sName of aNames.length ? aNames : ['app']) {
      // Checks that the schema exists
      const sSource = sName === 'app' ? sAppSchema : pluginSchema(sName);
      if (!existsSync(sSource)) {
        console.error(`[nano-app] [ERROR] "${sName}" has no schema: ${sSource}`);
        process.exit(1);
      }

      // A copy whose client lands next to it
      const sDir = `${process.cwd()}/.nano-app/prisma-clients/${sName}`;
      mkdirSync(sDir, { recursive: true });
      writeFileSync(
        `${sDir}/schema.prisma`,
        readFileSync(sSource, 'utf-8').replace(/output\s*=\s*"[^"]*"/, 'output = "./generated"'),
      );

      // Generates the client, and pushes the tables on push
      fnPrisma('generate', '--schema', `${sDir}/schema.prisma`);
      if (sCommand === 'push') {
        fnPrisma(
          'db',
          'push',
          '--schema',
          `${sDir}/schema.prisma`,
          '--url',
          sUrl!, // Checked above for push
          ...aFlags,
        );
      }
    }
  }
} catch (oError: any) {
  // any: anything can be thrown, also execFileSync's error with its status
  process.exit(oError?.status ?? 1);
}
