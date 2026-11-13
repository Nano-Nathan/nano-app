import { NextRequest, NextResponse } from 'next/server';
import Paths from '../utils/Paths';
import { ROUTES } from './state';
import target from './target';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { GuardedRoute } from '../types/proxy';

/** Lets a page through, or sends it to the `redirect` of its route when Better Auth does not allow it */
export default async function guard(oReq: NextRequest): Promise<Response> {
  // Finds the first route of the page; a page without one is public
  const oRoute = ROUTES.find(oItem => Paths.matches(oItem.match, oReq.nextUrl.pathname));
  if (!oRoute) return NextResponse.next();

  // Lets the page through when Better Auth allows it, and redirects it otherwise
  if (await allows(oReq, oRoute)) return NextResponse.next();
  return NextResponse.redirect(new URL(oRoute.redirect, oReq.url));
}

/** Whether Better Auth allows the request: a session, any of the roles and every permission */
async function allows(oReq: NextRequest, oRoute: GuardedRoute): Promise<boolean> {
  const { authPath, roles, permissions } = oRoute;

  // Reads the session: `null` without one
  const oSession = await ask(oReq, `${authPath}/get-session`);
  if (!oSession?.user) return false;

  // Needs any of the roles, separated by commas as Better Auth keeps them
  const aUserRoles: string[] = String(oSession.user.role ?? '').split(',');
  if (roles.size && !aUserRoles.some(sRole => roles.has(sRole))) return false;

  // Needs every permission, checked by the admin plugin
  if (!permissions) return true;
  const oCheck = await ask(oReq, `${authPath}/admin/has-permission`, { permissions });
  return oCheck?.success === true;
}

/** Answer of Better Auth in the backend of the store, with the browser's cookie and the app's origin */
async function ask(oReq: NextRequest, sPath: string, oBody?: unknown): Promise<NanoObject | null> {
  // Finds the backend, with the browser's cookie and origin
  const oTarget = target(
    new NextRequest(new URL(sPath, oReq.url), {
      headers: {
        cookie: oReq.headers.get('cookie') ?? '',
        origin: oReq.nextUrl.origin,
        'content-type': 'application/json',
      },
    }),
  );

  // Without the env vars of the store nothing is allowed
  if (!oTarget || 'missing' in oTarget) return null;

  // Sends a `GET`, or a `POST` with a body
  const oRes = await fetch(oTarget.url, {
    method: oBody ? 'POST' : 'GET',
    body: JSON.stringify(oBody),
    headers: oTarget.headers,
  });
  return oRes.json();
}
