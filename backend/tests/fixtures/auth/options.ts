import { admin } from 'better-auth/plugins';
import type { AuthOptions } from '../../../src/types/auth';

/** Better Auth options of the tests, with its rate limit on */
const OPTIONS: AuthOptions = {
  emailAndPassword: { enabled: true },
  rateLimit: { enabled: true },
  // Roles of the admin plugin: every new user is an admin, with its default permissions
  plugins: [admin({ defaultRole: 'admin' })],
};

export default OPTIONS;
