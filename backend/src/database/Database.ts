import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FileLoader, FileReader, Logger, NanoError, Validator } from '@nano-app/core';
import { OFFICIAL_PLUGINS } from '@nano-app/core/const';
import Prisma from './Prisma';
import type { PrismaPg } from '@prisma/adapter-pg';
import type { NanoObject } from '@nano-app/core';
import type { DatabaseConfig, PackageJson } from '../types/database';

/** Prisma clients of the app and its plugins, one per name */
export default abstract class Database {
  private static oAdapter?: PrismaPg;

  /** Mounted clients, by name */
  private static oClients: NanoObject = {};

  /** Initializes the Database client */
  public static async init(): Promise<void> {
    // Checks the DATABASE_URL is defined
    const sUrl = process.env.DATABASE_URL;
    if (!sUrl) throw new NanoError('The DATABASE_URL environment variable is not defined.');

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
      throw new NanoError(`The database "${sName}" is already mounted.`);
    }

    // Validates the schema before generating its client: PostgreSQL, and nano_* only for plugins
    const isPlugin = this.isOfficial(schemaPath);
    const sContent = FileReader.loadSchema(schemaPath);
    Validator.isPrisma(sContent, schemaPath, isPlugin);

    // Generates the client when its schema changed
    Prisma.generate(sName, schemaPath);

    // Creates the adapter when no consumer database did: it checks DATABASE_URL
    if (!this.oAdapter) await this.init();

    // An official plugin's tables are its own: nano-app migrates them
    if (isPlugin) Prisma.migrate(sName, schemaPath, FileReader.schemas(sContent)[0]);

    // Loads the client
    const sClientPath = join(Prisma.dir(sName), 'generated', 'client.ts');
    const PrismaClient = await FileLoader.findPrismaClient(sClientPath);

    // Instantiates the client with the pg adapter
    const oClient = new PrismaClient({ adapter: this.oAdapter });

    // Checks that every model can be read: a missing table or column fails here
    for (const [, sModel] of sContent.matchAll(/^\s*model\s+(\w+)/gm)) {
      await oClient[`${sModel[0].toLowerCase()}${sModel.slice(1)}`].findFirst();
    }

    // Mounts the client
    this.oClients[sName] = oClient;
    Logger.info(`Database "${sName}" mounted`);

    return oClient;
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
    const oPackage: PackageJson = JSON.parse(readFileSync(join(sDir, 'package.json'), 'utf-8'));
    return oPackage.name === OFFICIAL_PLUGINS;
  }
}
