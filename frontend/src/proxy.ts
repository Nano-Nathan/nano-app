import forward from './forward';
import guard from './guard';
import type { NextRequest } from 'next/server';

/** Sends `/api/<store>/<path>` to the backend of `<store>`, and guards the pages of `auth.routes` */
export async function proxy(oReq: NextRequest): Promise<Response> {
  // Reads the store named after `/api` (`/api/backend/users/7` → `backend`, `users/7`)
  const [, sPrefix, sName, ...aPath] = oReq.nextUrl.pathname.split('/');

  // A request outside `/api/<store>` is a page of the app
  if (sPrefix !== 'api' || !sName) return guard(oReq);

  // Sends the request to the backend of the store, with its query
  return forward(oReq, sName, `/${aPath.join('/')}${oReq.nextUrl.search}`);
}
