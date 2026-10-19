import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { admin, username } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { Pool } from 'pg';
import { mustChangePassword } from './admin';
import { SCHEMA } from './migrate';
import type { Auth, AuthOptions } from '../types/auth';

/** Better Auth on `basePath`, with its tables in the `nano_auth` schema of DATABASE_URL */
export function createAuth(basePath: string, oOptions: AuthOptions['betterAuth'] = {}): Auth {
  // Typed as the generic options, so the instance has one nameable type (Auth)
  const oConfig: BetterAuthOptions = {
    ...oOptions,
    basePath,
    database: new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${SCHEMA}`,
    }),
    // Sign-up is closed: the admin creates the users
    emailAndPassword: { enabled: true, disableSignUp: true },
    plugins: [
      admin(),
      username(),
      // An API key stands for its owner's session, so the guard accepts either
      apiKey({ enableSessionForAPIKeys: true }),
      mustChangePassword(),
    ],
  };

  return betterAuth(oConfig);
}
