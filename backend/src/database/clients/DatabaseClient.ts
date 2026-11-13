import type { Pool } from 'pg';
import type { DatabaseTable } from '@nano-app/core';
import type { DatabaseOptions } from '../../types/database';

/** A database the manager mounts, whatever its client: its tables, its client and its changes */
export default abstract class DatabaseClient<Config extends DatabaseOptions = DatabaseOptions> {
  public readonly sName: string;
  public readonly oConfig: Config;

  /** Creates a new client of a database, named as its plugin */
  constructor(sName: string, oConfig: Config) {
    this.sName = sName;
    this.oConfig = oConfig;
  }

  /** The Postgres schema and name of each of its tables */
  public abstract tables(): Promise<DatabaseTable[]>;

  /** Creates its client on the shared pool and gives it */
  public abstract connect(oPool: Pool): Promise<any>;

  /** Applies the pending migrations of a folder */
  public abstract migrate(sFolder: string): Promise<void>;

  /** Applies its tables as they are declared, failing on data loss */
  public abstract push(): Promise<void>;
}
