import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import type { BetterAuthOptions } from 'better-auth';

/** Better Auth options of the tests, also read by `npx auth generate` */
export const AUTH_OPTIONS: BetterAuthOptions = {
  emailAndPassword: { enabled: true },
  // Roles of the admin plugin: every new user is an admin, with its default permissions
  plugins: [admin({ defaultRole: 'admin' })],
};

/** Instance for the Better Auth CLI only: nano-app creates its own from the options */
export const auth = betterAuth(AUTH_OPTIONS);
