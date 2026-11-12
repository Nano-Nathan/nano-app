import { APP_NAME } from '@nano-app/core/const';
import { Logger, NanoError } from '@nano-app/core';
import type { Pool } from 'pg';
import type { DatabaseConfig } from '../types/plugin';

/** Key of the Postgres lock that lets one startup push at a time */
const PUSH_LOCK = 7_310_001;

/** Database of the app or of a plugin: its Drizzle client on the pool of `DATABASE_URL` */
export default class Database {
  private static oPool?: Pool;
  private sName: string;
  private oConfig: DatabaseConfig;
  // any: the client is typed by the schema of each app, unknown to the framework
  private oClient?: Promise<any>;

  /** Creates a new Database instance */
  constructor(sName: string, oConfig: DatabaseConfig) {
    this.sName = sName;
    this.oConfig = oConfig;
  }

  /** Its Drizzle client, created on the first call */
  // any: the client is typed by the schema of each app, unknown to the framework
  public client(): Promise<any> {
    this.oClient ??= this.create();
    return this.oClient;
  }

  /** Creates the client, checking the `nano_*` rule of its tables and pushing when asked */
  // any: the client is typed by the schema of each app, unknown to the framework
  private async create(): Promise<any> {
    const { sName } = this;
    const { schema, push } = this.oConfig;

    // Drizzle and pg are optional dependencies: imported only when a database is on
    const { defineRelations, is } = await import('drizzle-orm');
    const { getTableConfig, PgTable } = await import('drizzle-orm/pg-core');
    const { drizzle } = await import('drizzle-orm/node-postgres');

    // Checks the Postgres schema of each table
    const sOwn = `nano_${sName}`;
    const { breaks, rule } =
      sName === APP_NAME
        ? {
            breaks: (sSchema: string) => sSchema.startsWith('nano_'),
            rule: 'the nano_* schemas are reserved for plugins',
          }
        : {
            breaks: (sSchema: string) => sSchema !== sOwn,
            rule: `a plugin keeps its tables in "${sOwn}"`,
          };
    const aTables = Object.values(schema)
      .filter(oValue => is(oValue, PgTable))
      .map(oTable => {
        const { name, schema: sSchema = 'public' } = getTableConfig(oTable);
        return { name, sSchema };
      });
    for (const { name, sSchema } of aTables) {
      if (breaks(sSchema)) {
        throw new NanoError(
          `The database "${sName}": table "${sSchema}.${name}" breaks the rule, ${rule}.`,
        );
      }
    }

    // Applies the schema to the Postgres schemas of its tables, when asked
    const aSchemas = [...new Set(aTables.map(oTable => oTable.sSchema))];
    if (push && aSchemas.length) await this.push(aSchemas);

    // The client on the pool, with the relations of the schema
    const oClient = drizzle({
      client: await Database.pool(),
      relations: schema.relations ?? defineRelations(schema),
    });

    // The client, ready
    Logger.info(`Database "${sName}" mounted`);
    return oClient;
  }

  /** Pushes a schema to its Postgres schemas, one startup at a time; fails on data loss */
  private async push(aSchemas: string[]): Promise<void> {
    const { sName } = this;

    // drizzle-kit is an optional dependency: imported only to push
    const { pushSchema } = await import('drizzle-kit/api-postgres');
    const { drizzle } = await import('drizzle-orm/node-postgres');

    // One connection, holding the lock until the schema is applied
    const oConnection = await (await Database.pool()).connect();
    await oConnection.query('SELECT pg_advisory_lock($1)', [PUSH_LOCK]);

    // Compares the schema with the database
    const { sqlStatements, hints, apply } = await pushSchema(
      this.oConfig.schema,
      drizzle({ client: oConnection }),
      { schemas: aSchemas, tables: undefined, entities: undefined, extensions: undefined },
    );

    // Fails when it would lose data
    if (hints.length) {
      const sHints = hints.map(oHint => oHint.hint).join('; ');
      throw new NanoError(
        `The database "${sName}" cannot be pushed without losing data: ${sHints}. Run \`pnpm drizzle-kit push\` by hand.`,
      );
    }

    // Applies it; closing the connection frees the lock
    await apply();
    oConnection.release(true);
    Logger.info(`Database "${sName}" pushed: ${sqlStatements.length} statements`);
  }

  /** The pool of `DATABASE_URL`, shared by every client, created on the first call */
  private static async pool(): Promise<Pool> {
    // The pool already created
    if (this.oPool) return this.oPool;

    // Checks the URL of the database
    const sUrl = process.env.DATABASE_URL;
    if (!sUrl) throw new NanoError('The DATABASE_URL environment variable is not defined.');

    // Creates the pool: it connects on its first query
    const { Pool } = await import('pg');
    this.oPool = new Pool({ connectionString: sUrl });
    return this.oPool;
  }
}
