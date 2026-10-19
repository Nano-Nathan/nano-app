#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import 'dotenv/config';
import { getDir, MISSING_DATABASE_URL } from '../const';

/**
 * Prisma wrapper: clients are generated in .nano-app/prisma-clients/<name> ("app" is the project's schema).
 *   nano-app generate [name...] [--schema <path>]
 *   nano-app push [name...] [--schema <path>] [prisma flags, e.g. --accept-data-loss]
 *   nano-app <any other Prisma command>
 */
const [sCommand, ...aArgs] = process.argv.slice(2);

// Runs the consumer's Prisma CLI
const fnPrisma = (...aPrismaArgs: string[]): Buffer =>
  execFileSync(
    process.execPath,
    [createRequire(`${process.cwd()}/`).resolve('prisma/build/index.js'), ...aPrismaArgs],
    { stdio: 'inherit' },
  );

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
      const sSource = sName === 'app' ? sAppSchema : getDir('plugins', sName, 'schema.prisma');
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
