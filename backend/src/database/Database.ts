import { APP_NAME } from '@nano-app/core/const';
import { Logger, NanoError } from '@nano-app/core';
import type { Pool } from 'pg';
import type { NanoObject } from '@nano-app/core';
import type { DatabaseConfig } from '../types/database';

/** Drizzle clients of the app and its plugins, one per name, on one pool of `DATABASE_URL` */
export default abstract class Database {
  private static oPool?: Pool;

  /** Mounted clients, by name */
  private static oClients: NanoObject = {};

  /** Schemas of the mounted clients, by name */
  private static oSchemas: NanoObject<NanoObject> = {};

  /** Gets a client by name */
  // any: the client is typed by the schema of each app, unknown to the framework
  public static get(sName: string): any {
    return this.oClients[sName];
  }

  /** Gets the schema of a mounted client by name */
  public static schema(sName: string): NanoObject | undefined {
    return this.oSchemas[sName];
  }

  /** Mounts the Drizzle client of a schema: the app's tables outside `nano_*`, a plugin's only in `nano_<name>` */
  // any: the client is typed by the schema of each app, unknown to the framework
  public static async mount(sName: string, { schema }: DatabaseConfig): Promise<any> {
    // Fails when the name already has a client
    if (this.get(sName)) throw new NanoError(`The database "${sName}" is already mounted.`);

    // Drizzle and pg are optional dependencies: imported only when a database is on
    const { defineRelations, is } = await import('drizzle-orm');
    const { getTableConfig, PgTable } = await import('drizzle-orm/pg-core');
    const { drizzle } = await import('drizzle-orm/node-postgres');

    // Checks the Postgres schema of each table: none `nano_*` for the app, `nano_<name>` for a plugin
    const sOwn = `nano_${sName}`;
    const isApp = sName === APP_NAME;
    for (const oTable of Object.values(schema).filter(oValue => is(oValue, PgTable))) {
      const { name, schema: sSchema = 'public' } = getTableConfig(oTable);
      const isInvalid = isApp ? sSchema.startsWith('nano_') : sSchema !== sOwn;
      if (isInvalid) {
        const sRule = isApp
          ? 'the nano_* schemas are reserved for plugins'
          : `a plugin keeps its tables in "${sOwn}"`;
        throw new NanoError(
          `The database "${sName}": table "${sSchema}.${name}" breaks the rule, ${sRule}.`,
        );
      }
    }

    // Creates the pool once, then the client on it with the relations of the schema
    this.oPool ??= await this.pool();
    const oClient = drizzle({
      client: this.oPool,
      relations: schema.relations ?? defineRelations(schema),
    });

    // Mounts the client and its schema
    this.oClients[sName] = oClient;
    this.oSchemas[sName] = schema;
    Logger.info(`Database "${sName}" mounted`);
    return oClient;
  }

  /** The pool of `DATABASE_URL`, shared by every client */
  private static async pool(): Promise<Pool> {
    // Checks the URL of the database
    const sUrl = process.env.DATABASE_URL;
    if (!sUrl) throw new NanoError('The DATABASE_URL environment variable is not defined.');

    // Creates the pool: it connects on its first query
    const { Pool } = await import('pg');
    return new Pool({ connectionString: sUrl });
  }
}
