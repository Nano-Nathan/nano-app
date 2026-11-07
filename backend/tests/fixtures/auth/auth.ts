import { admin } from 'better-auth/plugins';
import type { BetterAuthOptions } from 'better-auth';

/** Better Auth options of the tests: nano-app creates the instance, the CLI reads `options` */
export default {
  options: {
    emailAndPassword: { enabled: true },
    // Roles of the admin plugin: every new user is an admin, with its default permissions
    plugins: [admin({ defaultRole: 'admin' })],
  } satisfies BetterAuthOptions,
};
