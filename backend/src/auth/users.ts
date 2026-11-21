import type { IncomingHttpHeaders } from 'node:http';
import type { Auth as BetterAuthInstance } from 'better-auth';
import type { NanoObject } from '@nano-app/core';
import type { RouteEntry } from '../types/route';

/** The users of Better Auth's admin plugin with crud's contract: a list as `{ values, count }` */
export default function users(
  oAuth: BetterAuthInstance<any>,
  fnHeaders: (oHeaders: IncomingHttpHeaders) => Headers,
): RouteEntry {
  // Its admin plugin, unknown to the type of the instance
  const oApi: NanoObject = oAuth.api;

  return {
    expression: '{/:id}',
    callbacks: {
      // The admin plugin asks the session of the request
      onBefore: async oReq => ({ headers: fnHeaders(oReq.headers) }),
    },
    GET: {
      handler: async (_oReq, { onBeforeResult: { headers } }) => {
        const { users: values } = await oApi.listUsers({ query: {}, headers });
        return { result: { values, count: values.length } };
      },
      permissions: { user: ['list'] },
    },
    POST: {
      handler: async (oReq, { onBeforeResult: { headers } }) => {
        const { user } = await oApi.createUser({ body: oReq.body, headers });
        return { result: user };
      },
      permissions: { user: ['create'] },
    },
    PUT: {
      handler: async (oReq, { onBeforeResult: { headers } }) => ({
        result: await oApi.adminUpdateUser({
          body: { userId: oReq.params.id, data: oReq.body },
          headers,
        }),
      }),
      permissions: { user: ['update'] },
    },
    DELETE: {
      handler: async (oReq, { onBeforeResult: { headers } }) => ({
        result: await oApi.removeUser({ body: { userId: oReq.params.id }, headers }),
      }),
      permissions: { user: ['delete'] },
    },
  };
}
