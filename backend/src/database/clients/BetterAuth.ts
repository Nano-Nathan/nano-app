import { Validator } from '@nano-app/core';
import DatabaseClient from './DatabaseClient';
import type { Pool } from 'pg';
import type { DatabaseTable } from '@nano-app/core';
import type { AuthOptions } from '../../types/auth';
import type { DatabaseOptions } from '../../types/database';

/** Better Auth's tables, as its options declare them, in its nano_* schema on its Kysely adapter */
export default class BetterAuth extends DatabaseClient {
  private oOptions: Omit<AuthOptions, 'database'>;
  private oPool: any;
  private oDatabase: any;

  /** Creates the database of Better Auth from its options */
  constructor(sName: string, oConfig: DatabaseOptions, oOptions: Omit<AuthOptions, 'database'>) {
    super(sName, oConfig);
    this.oOptions = oOptions;
  }

  /** Its tables, from the options: the base ones, its plugins' and the additional fields */
  public async tables(): Promise<DatabaseTable[]> {
    // Better Auth is an optional dependency: imported only when it is on
    const { getSchema } = await import('better-auth/db');

    // Every table in its nano_* schema
    const sSchema = Validator.reservedSchema(this.sName) ?? 'public';
    return Object.keys(getSchema(this.oOptions)).map(name => ({ schema: sSchema, name }));
  }

  /** Better Auth's `database` option on the shared pool, its tables in its nano_* schema */
  public async connect(oPool: Pool): Promise<any> {
    // Kysely is an optional dependency: imported only when Better Auth is on
    const { PostgresDialect } = await import('kysely');

    // The option, kept for its changes
    this.oPool = oPool;
    this.oDatabase = {
      dialect: new PostgresDialect({ pool: oPool }),
      type: 'postgres' as const,
      schemaName: Validator.reservedSchema(this.sName),
    };
    return this.oDatabase;
  }

  /** Applies the pending migrations of a folder, generated from `npx auth generate --adapter drizzle` */
  public async migrate(sFolder: string): Promise<void> {
    // Drizzle's migrator: imported only when Better Auth has migrations
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');

    // Recorded in its nano_* schema
    await migrate(drizzle({ client: this.oPool }), {
      migrationsFolder: sFolder,
      migrationsSchema: Validator.reservedSchema(this.sName),
    });
  }

  /** Creates the tables and columns its options need; it only adds */
  public async push(): Promise<void> {
    // Better Auth's migrations: imported only when it is on
    const { getMigrations } = await import('better-auth/db/migration');
    const { runMigrations } = await getMigrations({ ...this.oOptions, database: this.oDatabase });
    await runMigrations();
  }
}
