import type { BetterAuthOptions } from 'better-auth';

/** Better Auth options, without `database`: it uses the app's Drizzle client */
export type AuthOptions = Omit<BetterAuthOptions, 'database'>;
