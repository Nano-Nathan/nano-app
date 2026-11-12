import { APP_NAME } from '@nano-app/core/const';
import { Logger, NanoError } from '@nano-app/core';
import type { Pool } from 'pg';
import type { DatabaseConfig } from '../types/database';

/** Database of the app or of a plugin: its Drizzle client on the pool of `DATABASE_URL` */
export default class Database {
  private static oPool?: Pool;
  private sName: string;
  private oConfig?: DatabaseConfig;
  // any: the client is typed by the schema of each app, unknown to the framework
  private oClient?: Promise<any>;

  /** Creates a new Database instance */
  constructor(sName: string, oConfig?: DatabaseConfig) {
    this.sName = sName;
    this.oConfig = oConfig;
  }

  /** Its Drizzle client, created on the first call; undefined without a config */
  // any: the client is typed by the schema of each app, unknown to the framework
  public client(): Promise<any> {
    this.oClient ??= this.create();
    return this.oClient;
  }

  /** Creates the client, checking the `nano_*` rule of its tables */
  // any: the client is typed by the schema of each app, unknown to the framework
  private async create(): Promise<any> {
    // Without a config there is no database: no client
    if (!this.oConfig) return undefined;

    const {
      sName,
      oConfig: { schema },
    } = this;

    // Drizzle and pg are optional dependencies: imported only when a database is on
    const { defineRelations, is } = await import('drizzle-orm');
    const { getTableConfig, PgTable } = await import('drizzle-orm/pg-core');
    const { drizzle } = await import('drizzle-orm/node-postgres');

    // Checks the Postgres schema of each table: a nano_* one only for its plugin
    const sOwn = sName === APP_NAME ? undefined : `nano_${sName}`;
    for (const oTable of Object.values(schema).filter(oValue => is(oValue, PgTable))) {
      const { name, schema: sSchema = 'public' } = getTableConfig(oTable);
      if (sSchema.startsWith('nano_') && sSchema !== sOwn) {
        throw new NanoError(
          `The database "${sName}": table "${sSchema}.${name}" breaks the rule, each nano_* schema is reserved for the plugin of its name.`,
        );
      }
    }

    // Creates the pool once, then the client on it with the relations of the schema
    Database.oPool ??= await Database.pool();
    const oClient = drizzle({
      client: Database.oPool,
      relations: schema.relations ?? defineRelations(schema),
    });

    // The client, ready
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
