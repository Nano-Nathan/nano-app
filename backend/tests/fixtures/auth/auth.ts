import { betterAuth } from 'better-auth';

/** Better Auth options of the tests, also read by `npx auth generate` */
export const AUTH_OPTIONS = { emailAndPassword: { enabled: true } };

/** Instance for the Better Auth CLI only: nano-app creates its own from the options */
export const auth = betterAuth(AUTH_OPTIONS);
