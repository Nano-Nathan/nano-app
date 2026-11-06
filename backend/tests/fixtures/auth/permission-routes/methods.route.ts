import { createRoute } from '../../../../src/app/creators';
import type { NanoObject } from '@nano-app/core';

/** Permissions of each method: the admin role lists users, but has none on notes */
const PERMISSIONS: NanoObject<NanoObject<string[]>> = {
  GET: { user: ['list'] },
  POST: { notes: ['create'] },
};

/** A route whose permissions depend on the request */
export default createRoute({
  permissions: oReq => PERMISSIONS[oReq.method],
  GET: async () => ({ message: 'listed' }),
  POST: async () => ({ message: 'created' }),
});
