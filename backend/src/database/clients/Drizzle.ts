import { NanoError } from '@nano-app/core';
import type { Pool } from 'pg';
import type { DatabaseTable } from '@nano-app/core';
import type { DatabaseClient, DatabaseConfig } from '../../types/database';

/** Drizzle client of the app or of a plugin: its tables, its client and its changes */
export default class Drizzle implements DatabaseClient {
  private sName: string;
  private oConfig: DatabaseConfig;
  private oClient: any;

  /** Creates a new Drizzle instance */
  constructor(sName: string, oConfig: DatabaseConfig) {
    this.sName = sName;
    this.oConfig = oConfig;
  }

  /** The Postgres schema and name of each of its tables, from Drizzle's metadata */
  public async tables(): Promise<DatabaseTable[]> {
    // Drizzle is an optional dependency: imported only when a database is on
    const { is } = await import('drizzle-orm');
    const { getTableConfig, PgTable } = await import('drizzle-orm/pg-core');

    // Its tables, in public when they declare no schema
    return Object.values(this.oConfig.relations)
      .map(({ table }) => table)
      .filter(oTable => is(oTable, PgTable))
      .map(oTable => {
        const { name, schema = 'public' } = getTableConfig(oTable);
        return { schema, name };
      });
  }

  /** Creates its client on a pool */
  public async connect(oPool: Pool): Promise<any> {
    const { migrate, push, ...oDrizzleConfig } = this.oConfig;

    // Drizzle is an optional dependency: imported only when a database is on
    const { drizzle } = await import('drizzle-orm/node-postgres');

    // The client with Drizzle's options
    this.oClient = drizzle({ ...oDrizzleConfig, client: oPool });
    return this.oClient;
  }

  /** Applies the pending migrations of a folder */
  public async migrate(sFolder: string): Promise<void> {
    // Drizzle's migrator: imported only when a database has migrations
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    await migrate(this.oClient, { migrationsFolder: sFolder });
  }

  /** Pushes its tables to their Postgres schemas, failing when it would lose data */
  public async push(): Promise<void> {
    // drizzle-kit is an optional dependency: imported only when a push is on
    const { pushSchema } = await import('drizzle-kit/api-postgres');

    // Its tables by name, only in the Postgres schemas they use
    const oTables = Object.fromEntries(
      Object.values(this.oConfig.relations).map(({ name, table }) => [name, table]),
    );
    const aSchemas = (await this.tables()).map(({ schema }) => schema);
    const { hints, apply } = await pushSchema(oTables, this.oClient, {
      schemas: aSchemas,
      tables: undefined,
      entities: undefined,
      extensions: undefined,
    });

    // Fails when it would lose data
    if (hints.length) {
      const sHints = hints.map(oHint => oHint.hint).join('; ');
      throw new NanoError(
        `The database "${this.sName}" cannot be pushed without losing data: ${sHints}. Run \`pnpm drizzle-kit push\` by hand.`,
      );
    }
    await apply();
  }
}
