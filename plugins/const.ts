import type { NanoObject } from '@nano-app/backend';

/** Action of each method: its permission of Better Auth and the validation of its body */
export const ACTIONS: NanoObject<string> = {
  GET: 'read',
  QUERY: 'read',
  POST: 'create',
  PUT: 'update',
  DELETE: 'delete',
};

/** Records a list answers when the request sends no `limit` */
export const DEFAULT_LIMIT = 100;
