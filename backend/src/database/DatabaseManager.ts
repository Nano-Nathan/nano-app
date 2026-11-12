import { APP_NAME } from '@nano-app/core/const';
import { Logger, NanoError } from '@nano-app/core';
import type { Pool } from 'pg';
import type { NanoObject } from '@nano-app/core';
import type { DatabaseConfig } from '../types/database';

/** The databases of the app and its plugins: one Drizzle client per name on the pool of `DATABASE_URL` */
export default abstract class DatabaseManager {
  private static oPool?: Promise<Pool>;
  // any: the client is typed by the schema of each app, unknown to the framework
  private static oClients: NanoObject<Promise<any>> = {};

  /** The Drizzle client of a database, created on the first call; without a config, the app's */
  // any: the client is typed by the schema of each app, unknown to the framework
  public static async mount(sName: string, oConfig?: DatabaseConfig): Promise<any> {
    // Without a config, the client of the app; undefined when it has none
    if (!oConfig) return this.oClients[APP_NAME];

    // Creates it once per name
    this.oClients[sName] ??= this.create(sName, oConfig);
    return this.oClients[sName];
  }

  /** Creates a client: the `nano_*` rule of its tables, then its push and its migrations */
  // any: the client is typed by the schema of each app, unknown to the framework
  private static async create(sName: string, oConfig: DatabaseConfig): Promise<any> {
    const { schema, push, migrations } = oConfig;

    // Drizzle and pg are optional dependencies: imported only when a database is on
    const { defineRelations, is } = await import('drizzle-orm');
    const { getTableConfig, PgTable } = await import('drizzle-orm/pg-core');
    const { drizzle } = await import('drizzle-orm/node-postgres');

    // Checks the Postgres schema of each table: a nano_* one only for its plugin
    const sOwn = sName === APP_NAME ? undefined : `nano_${sName}`;
    const aSchemas = Object.values(schema)
      .filter(oValue => is(oValue, PgTable))
      .map(oTable => {
        const { name, schema: sSchema = 'public' } = getTableConfig(oTable);
        if (sSchema.startsWith('nano_') && sSchema !== sOwn) {
          throw new NanoError(
            `The database "${sName}": table "${sSchema}.${name}" breaks the rule, each nano_* schema is reserved for the plugin of its name.`,
          );
        }
        return sSchema;
      });

    // Creates the pool once, then the client on it with the relations of the schema
    const oClient = drizzle({
      client: await this.pool(),
      relations: schema.relations ?? defineRelations(schema),
    });

    // Pushes the schema to the Postgres schemas of its tables, when asked
    if (push && aSchemas.length) {
      const { pushSchema } = await import('drizzle-kit/api-postgres');
      const { hints, apply } = await pushSchema(schema, oClient, {
        schemas: aSchemas,
        tables: undefined,
        entities: undefined,
        extensions: undefined,
      });

      // Fails when it would lose data
      if (hints.length) {
        const sHints = hints.map(oHint => oHint.hint).join('; ');
        throw new NanoError(
          `The database "${sName}" cannot be pushed without losing data: ${sHints}. Run \`pnpm drizzle-kit push\` by hand.`,
        );
      }
      await apply();
    }

    // Applies its pending migrations, when it has a folder
    if (migrations) {
      const { migrate } = await import('drizzle-orm/node-postgres/migrator');
      await migrate(oClient, { migrationsFolder: migrations });
    }

    // The client, ready
    Logger.info(`Database "${sName}" mounted`);
    return oClient;
  }

  /** The pool of `DATABASE_URL`, shared by every client and Better Auth, created on the first call */
  public static pool(): Promise<Pool> {
    this.oPool ??= this.createPool();
    return this.oPool;
  }

  /** Creates the pool of `DATABASE_URL` */
  private static async createPool(): Promise<Pool> {
    // Checks the URL of the database
    const sUrl = process.env.DATABASE_URL;
    if (!sUrl) throw new NanoError('The DATABASE_URL environment variable is not defined.');

    // Creates the pool: it connects on its first query
    const { Pool } = await import('pg');
    return new Pool({ connectionString: sUrl });
  }
}
