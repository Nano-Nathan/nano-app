import { Logger, NanoError } from '@nano-app/core';
import type { Pool } from 'pg';
import { LOCK } from '../const';
import type DatabaseClient from './clients/DatabaseClient';
import type { DatabaseOptions } from '../types/database';

/** The databases of the app and its plugins: the pool of `DATABASE_URL`, its lock and one client per config */
export default abstract class DatabaseManager {
  private static oPool: Pool;
  private static oClients = new Map<DatabaseOptions, Promise<any>>();

  /** Mounts a database once, whatever its client, and gives its client; undefined without one */
  public static async mount(oDB?: DatabaseClient): Promise<any> {
    // Without a client there is no database
    if (!oDB) return undefined;

    // One client per config: the plugins without their own share the app's
    return this.getClient(oDB);
  }

  /** The pool of `DATABASE_URL`, shared by every client, created on the first call */
  private static async pool(): Promise<Pool> {
    // Checks the URL of the database
    const sUrl = process.env.DATABASE_URL;
    if (!sUrl) throw new NanoError('The DATABASE_URL environment variable is not defined.');

    // pg is an optional dependency: imported only when a database is on
    const { Pool } = await import('pg');

    // Creates the pool once: it connects on its first query
    this.oPool ??= new Pool({ connectionString: sUrl });
    return this.oPool;
  }

  /** Creates the client of a database on the shared pool, with the lock for its changes */
  private static async getClient(oDB: DatabaseClient): Promise<any> {
    const { sName, oConfig } = oDB;
    const oClient = this.oClients.get(oConfig);
    if (oClient !== undefined) return oClient;

    // The pool, created by the first database
    await this.pool();

    // Its tables follow the nano_* rule, then its client: how it is made is up to it
    await oDB.checkTables();
    const oDBClient = await oDB.connect(this.oPool);

    // One connection holds the lock while its changes run
    const oConnection = await this.oPool.connect();
    await oConnection.query('SELECT pg_advisory_lock($1)', [LOCK]);

    // Migrate or push if needed
    const { migrate, push } = oConfig;
    if (migrate) await oDB.migrate(migrate);
    if (push) await oDB.push();

    // Closing the connection frees the lock
    oConnection.release(true);

    // The client, ready
    Logger.info(`Database "${sName}" mounted`);
    this.oClients.set(oConfig, oDBClient);
    return oDBClient;
  }
}
