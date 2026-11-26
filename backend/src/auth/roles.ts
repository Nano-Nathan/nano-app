import type { BetterAuthPlugin } from 'better-auth';
import type { NanoObject } from '@nano-app/core';
import type { RouteEntry } from '../types/route';

/** The roles of Better Auth's admin plugin with crud's contract: a list of `{ id, name }` */
export default async function roles(oAdmin: BetterAuthPlugin): Promise<RouteEntry> {
  // The roles of its options, else the default ones of the plugin
  const { defaultRoles } = await import('better-auth/plugins/admin/access');
  const oRoles: NanoObject = oAdmin.options?.roles ?? defaultRoles;

  // Its names, the same for each one's id and its text
  const values = Object.keys(oRoles).map(id => ({ id, name: id }));

  return {
    GET: {
      handler: async () => ({ result: { values, count: values.length } }),
      permissions: { user: ['list'] },
    },
  };
}
