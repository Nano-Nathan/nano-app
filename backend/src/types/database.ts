import type { AnyRelations } from 'drizzle-orm';
import type { DrizzlePgConfig } from 'drizzle-orm/pg-core';

/** What every database has, whatever its client */
export type DatabaseOptions = {
  /** Folder of its migrations, applied at startup */
  migrate?: string;
  /** Applies its tables at startup as they are declared, failing on data loss; not with `migrate` */
  push?: boolean;
};

/** Drizzle's options for its client: its tables and how they relate, from `defineRelations` */
export type DrizzleConfig = DrizzlePgConfig<AnyRelations> & { relations: AnyRelations };

/** Database of a plugin or of the app: the options of its client and what every database has */
export type DatabaseConfig = DatabaseOptions & DrizzleConfig;
