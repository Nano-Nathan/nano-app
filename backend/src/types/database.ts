import type { AnyRelations } from 'drizzle-orm';
import type { DrizzlePgConfig } from 'drizzle-orm/pg-core';
import type { Pool } from 'pg';
import type { DatabaseTable } from '@nano-app/core';

/** What every database has, whatever its client */
type DatabaseOptions = {
  /** Folder of its migrations, applied at startup */
  migrate?: string;
  /** Applies its tables at startup as they are declared, failing on data loss; not with `migrate` */
  push?: boolean;
};

/** Drizzle's options for its client: its tables and how they relate, from `defineRelations` */
export type DrizzleConfig = DrizzlePgConfig<AnyRelations> & { relations: AnyRelations };

/** Database of a plugin or of the app: the options of its client and what every database has */
export type DatabaseConfig = DatabaseOptions & DrizzleConfig;

/** A client the databases mount: it is created on the shared pool and applies its own changes */
export type DatabaseClient = {
  /** The Postgres schema and name of each of its tables */
  tables(): Promise<DatabaseTable[]>;
  /** Creates its client on the shared pool and gives it */
  connect(oPool: Pool): Promise<any>;
  /** Applies the pending migrations of a folder */
  migrate(sFolder: string): Promise<void>;
  /** Applies its tables as they are declared, failing on data loss */
  push(): Promise<void>;
};
