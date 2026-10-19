import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';
import type { BetterAuthPlugin } from 'better-auth';
import type { Auth } from '../types/auth';

/** Password of the admin created on the first startup. Its first sign-in has to change it */
export const DEFAULT_ADMIN_PASSWORD = 'admin1234';

/** Username of the admin created on the first startup */
const ADMIN_USERNAME = 'admin';

/** Answer to every request of a user that still has to change the password */
export const CHANGE_PASSWORD_MESSAGE =
  'Change the default password first: POST <basePath>/change-password';

/** Better Auth endpoints a user can call before changing the default password */
const ALLOWED_PATHS = ['/sign-in/username', '/get-session', '/change-password', '/sign-out'];

/**
 * `mustChangePassword` on the user: while it is true, every other Better Auth endpoint
 * answers 403 (the guard does the same on the routes). `/change-password` clears it
 */
export function mustChangePassword(): BetterAuthPlugin {
  return {
    id: 'nano-app-must-change-password',
    schema: {
      user: {
        fields: { mustChangePassword: { type: 'boolean', defaultValue: false, input: false } },
      },
    },
    hooks: {
      before: [
        {
          matcher: oCtx => !ALLOWED_PATHS.includes(oCtx.path ?? ''),
          handler: createAuthMiddleware(async oCtx => {
            // Rejects the request when its user still has the default password
            const oSession = await getSessionFromCtx<{ mustChangePassword: boolean }>(oCtx);
            if (oSession?.user.mustChangePassword) {
              throw new APIError('FORBIDDEN', { message: CHANGE_PASSWORD_MESSAGE });
            }
          }),
        },
      ],
      after: [
        {
          matcher: oCtx => oCtx.path === '/change-password',
          handler: createAuthMiddleware(async oCtx => {
            // Clears the flag once the password changed
            const oSession = oCtx.context.session;
            if (!oSession || oCtx.context.returned instanceof Error) return;
            await oCtx.context.internalAdapter.updateUser(oSession.user.id, {
              mustChangePassword: false,
            });
          }),
        },
      ],
    },
  };
}

/** Creates the admin user with the default password if it does not exist, and warns while it keeps it */
export async function ensureAdmin(oAuth: Auth): Promise<void> {
  // Looks for the admin
  const oCtx = await oAuth.$context;
  const oUser = await oCtx.adapter.findOne<{ mustChangePassword: boolean }>({
    model: 'user',
    where: [{ field: 'username', value: ADMIN_USERNAME }],
  });
  if (oUser && !oUser.mustChangePassword) return;

  // Creates it on the first startup: a server-side call, without a session.
  // any: Auth is typed with the generic options, so it does not list the admin plugin's endpoints
  if (!oUser) {
    await (oAuth.api as any).createUser({
      body: {
        email: 'admin@nano-app.local',
        password: DEFAULT_ADMIN_PASSWORD,
        name: ADMIN_USERNAME,
        role: 'admin',
        data: { username: ADMIN_USERNAME, mustChangePassword: true },
      },
    });
  }

  // Warns until the password changes
  console.warn(
    `[nano-app] [WARNING] auth: user "${ADMIN_USERNAME}" has the default password "${DEFAULT_ADMIN_PASSWORD}". Sign in and change it: until then everything else answers 403.`,
  );
}
