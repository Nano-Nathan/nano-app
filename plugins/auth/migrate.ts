import { getMigrations } from 'better-auth/db/migration';
import type { Pool } from 'pg';
import type { Auth } from '../types/auth';

/** Postgres schema of the plugin's tables */
export const SCHEMA = 'nano_auth';

/** The pool of the plugin, once DATABASE_URL is known to be set (pg would fall back to localhost) */
function poolOf(oAuth: Auth): Pool {
  // Fails when DATABASE_URL is missing
  if (!process.env.DATABASE_URL) {
    throw new Error(
      '[nano-app] [ERROR] auth: the DATABASE_URL environment variable is not defined.',
    );
  }
  return oAuth.options.database as unknown as Pool;
}

/** What the database lacks for this configuration, or null when it is up to date. Read only */
export async function pendingMigrations(oAuth: Auth): Promise<string | null> {
  // Checks the schema
  const { rows } = await poolOf(oAuth).query('SELECT 1 FROM pg_namespace WHERE nspname = $1', [
    SCHEMA,
  ]);
  if (!rows.length) return `the "${SCHEMA}" schema does not exist`;

  // Checks the tables and their fields
  const { toBeCreated, toBeAdded } = await getMigrations(oAuth.options);
  const aTables = [...toBeCreated, ...toBeAdded].map(oTable => oTable.table);
  if (!aTables.length) return null;

  return `tables to create or update in "${SCHEMA}": ${[...new Set(aTables)].join(', ')}`;
}

/** Creates the schema and the tables Better Auth needs. It never drops anything */
export async function migrate(oAuth: Auth): Promise<string[]> {
  // Creates the schema
  await poolOf(oAuth).query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);

  // Creates the tables and the missing fields
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(oAuth.options);
  await runMigrations();

  return [
    ...toBeCreated.map(({ table }) => `created ${SCHEMA}.${table}`),
    ...toBeAdded.map(
      ({ table, fields }) => `added ${Object.keys(fields).join(', ')} to ${SCHEMA}.${table}`,
    ),
  ];
}
