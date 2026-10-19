import type { betterAuth, BetterAuthOptions } from 'better-auth';

/** Options of the auth plugin */
export type AuthOptions = {
  /** Base path of the Better Auth endpoints. Defaults to "/auth" */
  basePath?: string;
  /** Exact paths the guard lets through, e.g. "/webhooks/telegram". Defaults to [] */
  publicPaths?: string[];
  /** Better Auth options, as Better Auth documents them. The plugin owns the rest */
  betterAuth?: Omit<BetterAuthOptions, 'database' | 'basePath' | 'emailAndPassword' | 'plugins'>;
};

/** Better Auth instance of the plugin */
export type Auth = ReturnType<typeof betterAuth<BetterAuthOptions>>;
