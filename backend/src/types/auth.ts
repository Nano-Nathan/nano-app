import type { BetterAuthOptions } from 'better-auth';
import type { DatabaseOptions } from './database';

/** Better Auth options; `database` says how its tables are applied, `push` by default */
export type AuthOptions = Omit<BetterAuthOptions, 'database'> & {
  /** How its tables are applied at startup: `migrate` or `push`. Defaults to `{ push: true }` */
  database?: DatabaseOptions;
};
