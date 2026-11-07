import type { NanoObject, Params } from '@nano-app/core';

/** Whether the session's user has the permissions; always without Better Auth or permissions */
export default async function isGranted(
  { auth, session }: Params,
  oPermissions?: NanoObject<string[]>,
): Promise<boolean> {
  // Nothing to check without Better Auth or permissions
  if (!auth || !oPermissions) return true;

  // Asks Better Auth whether the role of the user has the permissions
  const { success } = await auth.api.userHasPermission({
    body: { userId: session?.user.id, role: session?.user.role, permissions: oPermissions },
  });
  return success;
}
