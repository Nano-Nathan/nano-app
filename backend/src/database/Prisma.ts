import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { FileReader, Formatter } from '@nano-app/core';
import { MISSING_DATABASE_URL } from '@nano-app/core/const';
import type { ClientSource } from '../types/database';

/** Runs the consumer's Prisma CLI: generates clients and applies official plugins' migrations */
export default abstract class Prisma {
  /** Folder of a client and its files, in the project */
  public static dir(sName: string): string {
    return join(process.cwd(), '.nano-app', 'prisma-clients', sName);
  }

  /** Generates the client of a schema in `.nano-app/prisma-clients/<name>`, unless it is up to date */
  public static generate(sName: string, sSchemaPath: string): void {
    // Reads the schema and the source of the current client
    const sDir = this.dir(sName);
    const sSource = FileReader.getAbsolutePath(sSchemaPath);
    const sHash = createHash('sha256').update(readFileSync(sSource)).digest('hex');
    const sSourceFile = join(sDir, 'source.json');
    const oCurrent: ClientSource | undefined = existsSync(sSourceFile)
      ? JSON.parse(readFileSync(sSourceFile, 'utf-8'))
      : undefined;

    // Warns when the folder holds the client of another schema
    if (oCurrent && oCurrent.schemaPath !== sSource) {
      console.warn(
        `[nano-app] [WARNING] .nano-app/prisma-clients/${sName} has the client of ${oCurrent.schemaPath}: it is replaced by the one of ${sSource}.`,
      );
    }

    // Skips a client generated from this same schema
    const isUpToDate = oCurrent?.schemaPath === sSource && oCurrent.hash === sHash;
    if (isUpToDate && existsSync(join(sDir, 'generated', 'client.ts'))) return;

    // A copy of the schema whose client lands next to it, whatever its output says
    mkdirSync(sDir, { recursive: true });
    const sSchema = readFileSync(sSource, 'utf-8');
    writeFileSync(
      join(sDir, 'schema.prisma'),
      sSchema.replace(/output\s*=\s*"[^"]*"/, 'output = "./generated"'),
    );

    // Generates it and remembers where it came from
    this.run(sName, ['generate', '--schema', join(sDir, 'schema.prisma')]);
    writeFileSync(sSourceFile, JSON.stringify({ schemaPath: sSource, hash: sHash }));
    console.log(`[nano-app] [INFO] Prisma client "${sName}" generated`);
  }

  /** Applies the pending migrations an official plugin ships next to its schema */
  public static migrate(sName: string, sSchemaPath: string, sDbSchema: string): void {
    // Checks that the plugin ships its migrations
    const sMigrations = join(dirname(FileReader.getAbsolutePath(sSchemaPath)), 'migrations');
    if (!existsSync(sMigrations)) {
      throw new Error(
        `[nano-app] [ERROR] The plugin "${sName}" ships no migrations: ${sMigrations}`,
      );
    }

    // Checks the database URL
    if (!process.env.DATABASE_URL) throw new Error(MISSING_DATABASE_URL);

    // The plugin's history lives in its own schema, apart from the consumer's
    const oUrl = new URL(process.env.DATABASE_URL);
    oUrl.searchParams.set('schema', sDbSchema);

    // A Prisma config for the deploy: the URL travels in the environment, never on disk
    const sConfig = join(this.dir(sName), 'prisma.config.mjs');
    writeFileSync(
      sConfig,
      [
        'export default {',
        `  schema: ${JSON.stringify(join(this.dir(sName), 'schema.prisma'))},`,
        `  migrations: { path: ${JSON.stringify(sMigrations)} },`,
        '  datasource: { url: process.env.NANO_APP_MIGRATION_URL },',
        '};',
        '',
      ].join('\n'),
    );

    // Applies them: in order, each once, one instance at a time (Prisma locks the database)
    this.run(sName, ['migrate', 'deploy', '--config', sConfig], {
      NANO_APP_MIGRATION_URL: oUrl.toString(),
    });
  }

  /** Runs a Prisma command of the consumer's `prisma` package */
  private static run(sName: string, aArgs: string[], oEnv: NodeJS.ProcessEnv = {}): void {
    // Finds the CLI in the project
    let sCli: string;
    try {
      sCli = createRequire(`${process.cwd()}/`).resolve('prisma/build/index.js');
    } catch {
      // Not resolvable: the package is not installed
      throw new Error(
        `[nano-app] [ERROR] The database "${sName}" needs Prisma. Run \`pnpm add prisma\`.`,
      );
    }

    // Runs it, keeping its output for the error
    try {
      execFileSync(process.execPath, [sCli, ...aArgs], {
        env: { ...process.env, ...oEnv },
        stdio: 'pipe',
      });
    } catch (oError) {
      // execFileSync's error carries the command's stderr and stdout
      const isOutput = oError instanceof Error && 'stderr' in oError && 'stdout' in oError;
      const sOutput = isOutput ? `${oError.stderr}${oError.stdout}`.trim() : '';
      throw new Error(
        `[nano-app] [ERROR] prisma ${aArgs[0]} failed for "${sName}": ${sOutput || Formatter.error(oError)}`,
      );
    }
  }
}
