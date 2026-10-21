import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FileLoader, FileReader, Formatter, type NanoObject } from '@nano-app/core';
import { MISSING_DATABASE_URL, OFFICIAL_PLUGINS } from '@nano-app/core/const';
import Prisma from './Prisma';
import type { PrismaPg } from '@prisma/adapter-pg';
import type { DatabaseConfig } from '../types/database';

/** Prisma clients of the app and its plugins, one per name */
export default abstract class Database {
  private static oAdapter?: PrismaPg;

  /** Mounted clients, by name */
  private static oClients: NanoObject = {};

  /** Initializes the Database client */
  public static async init(): Promise<void> {
    // Checks the DATABASE_URL is defined
    const sUrl = process.env.DATABASE_URL;
    if (!sUrl) {
      throw new Error(MISSING_DATABASE_URL);
    }

    // Create the adapter (imported only when needed)
    const { PrismaPg } = await import('@prisma/adapter-pg');
    this.oAdapter = new PrismaPg({ connectionString: sUrl });
  }

  /** Gets a client by name */
  // any: the Prisma client is generated per plugin, unknown to the framework
  public static get(sName: string): any {
    return this.oClients[sName];
  }

  /** Generates and mounts the Prisma client of a schema; an official plugin's is also migrated */
  // any: the Prisma client is generated per plugin, unknown to the framework
  public static async mount(sName: string, { schemaPath }: DatabaseConfig): Promise<any> {
    // Fail if trying to mount a client that already exists
    if (this.get(sName)) {
      throw new Error(`[nano-app] [ERROR] The database "${sName}" is already mounted.`);
    }

    // Official plugins' schemas use only nano_*; the others never do
    const isPlugin = this.isOfficial(schemaPath);
    const aSchemas = this.declaredSchemas(schemaPath);
    const isPluginInvalid = !aSchemas.length || aSchemas.some(sItem => !sItem.startsWith('nano_'));
    const isConsumerInvalid = aSchemas.some(sItem => sItem.startsWith('nano_'));
    const isInvalid = isPlugin ? isPluginInvalid : isConsumerInvalid;
    if (isInvalid) {
      throw new Error(
        `[nano-app] [ERROR] ${schemaPath}: ${isPlugin ? 'a plugin declares only nano_* schemas' : 'the nano_* schemas are reserved for plugins'}.`,
      );
    }

    // Generates the client when its schema changed
    Prisma.generate(sName, schemaPath);

    // An official plugin's tables are its own: nano-app migrates them
    if (isPlugin) Prisma.migrate(sName, schemaPath, aSchemas[0]);

    // Creates the adapter when no consumer database did
    if (!this.oAdapter) await this.init();

    // Loads the client and validates the schema
    const sClientPath = join(Prisma.dir(sName), 'generated', 'client.ts');
    const PrismaClient = await FileLoader.findPrismaClient(sClientPath, schemaPath);

    // Instantiates the client
    let oClient;
    try {
      // Instantiates it with the pg adapter
      oClient = new PrismaClient({ adapter: this.oAdapter });
    } catch (oError) {
      throw new Error(
        `[nano-app] [ERROR] Cannot instantiate the database "${sName}" from ${sClientPath}: ${Formatter.error(oError)}`,
      );
    }

    // Checks that every model can be read: a missing table or column fails here
    const sFix = isPlugin
      ? 'Update the plugin or report it.'
      : 'Apply your schema with Prisma (db push or migrations).';
    for (const [, sModel] of FileReader.loadSchema(schemaPath).matchAll(/^\s*model\s+(\w+)/gm)) {
      await oClient[`${sModel[0].toLowerCase()}${sModel.slice(1)}`]
        .findFirst()
        .catch((oError: unknown) => {
          // Last line of Prisma's message: the table or column that is missing
          const sReason = Formatter.error(oError).trim().split('\n').pop();
          throw new Error(
            `[nano-app] [ERROR] The database "${sName}" is not ready: ${sReason} ${sFix}`,
          );
        });
    }

    // Mounts the client
    this.oClients[sName] = oClient;
    console.log(`[nano-app] [INFO] Database "${sName}" mounted`);

    return oClient;
  }

  /** Schemas a Prisma schema declares in its datasource (`schemas = [...]`) */
  private static declaredSchemas(sSchemaPath: string): string[] {
    const sDeclared =
      FileReader.loadSchema(sSchemaPath).match(
        /datasource\s+\w+\s*\{[^}]*schemas\s*=\s*\[([^\]]*)\]/s,
      )?.[1] ?? '';
    return [...sDeclared.matchAll(/["']([^"']+)["']/g)].map(([, sItem]) => sItem);
  }

  /** Whether a schema ships with the official plugins: its nearest package.json is theirs */
  private static isOfficial(sSchemaPath: string): boolean {
    // Walks up from the schema's folder to the filesystem root
    let sDir = dirname(FileReader.getAbsolutePath(sSchemaPath));
    while (!existsSync(join(sDir, 'package.json'))) {
      if (dirname(sDir) === sDir) return false;
      sDir = dirname(sDir);
    }

    // Checks the name of the package it belongs to
    const { name } = JSON.parse(readFileSync(join(sDir, 'package.json'), 'utf-8'));
    return name === OFFICIAL_PLUGINS;
  }
}
