import { admin } from 'better-auth/plugins';
import type { BetterAuthOptions } from 'better-auth';

/** Better Auth options of the tests, with its rate limit on */
const OPTIONS: BetterAuthOptions = {
  emailAndPassword: { enabled: true },
  rateLimit: { enabled: true },
  // Roles of the admin plugin: every new user is an admin, with its default permissions
  plugins: [admin({ defaultRole: 'admin' })],
};

/** The app's `src/auth.ts`: nano-app reads `options`, and so does `npx auth generate` */
export default { options: OPTIONS };
