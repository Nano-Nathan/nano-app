import { NextResponse } from 'next/server';
import { DEFAULT_REDIRECT } from '@nano-app/core/const';
import Paths from '@nano-app/core/utils/Paths';
import forward from './forward';
import STORE_FILES from './stores/storeFiles';
import type { NextRequest } from 'next/server';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { GuardedRoute } from './types/store';

/** Routes of every store with `auth`, in order, read once when the proxy loads */
const ROUTES: GuardedRoute[] = Object.entries(STORE_FILES).flatMap(([sName, { auth }]) =>
  auth
    ? (auth.routes ?? []).map(({ match, redirect, roles, permissions }) => ({
        store: sName,
        path: auth.path,
        match,
        redirect: redirect ?? DEFAULT_REDIRECT,
        roles: roles?.split(','),
        permissions:
          permissions &&
          Object.fromEntries(
            Object.entries(permissions).map(([sResource, sActions]) => [
              sResource,
              sActions.split(','),
            ]),
          ),
      }))
    : [],
);

/** Lets a page through, or redirects it when its route of `auth.routes` does not allow the request */
export default async function guard(oReq: NextRequest): Promise<Response> {
  // Finds the first route of the page; a page without one is public
  const oRoute = ROUTES.find(oItem => Paths.matches(oItem.match, oReq.nextUrl.pathname));
  if (!oRoute) return NextResponse.next();

  // Lets the page through when Better Auth allows the request
  if (await allows(oRoute, oReq)) return NextResponse.next();

  // Redirects it
  return NextResponse.redirect(new URL(oRoute.redirect, oReq.url));
}

/** Whether Better Auth allows the request: a session, any of the roles and every permission */
async function allows(oRoute: GuardedRoute, oReq: NextRequest): Promise<boolean> {
  const { store, path, roles, permissions } = oRoute;

  // Sends the browser's cookie, and the app's origin that Better Auth checks on a `POST`
  const oInit = {
    headers: {
      cookie: oReq.headers.get('cookie') ?? '',
      origin: oReq.nextUrl.origin,
      'content-type': 'application/json',
    },
  };

  // Checks the permissions with the admin plugin; without a session it answers 401
  if (permissions) {
    const oBody = JSON.stringify({ permissions });
    const oReqCheck = new Request(oReq.url, { ...oInit, method: 'POST', body: oBody });
    const oCheck: NanoObject | null = await (
      await forward(oReqCheck, store, `${path}/admin/has-permission`)
    ).json();
    if (!oCheck?.success) return false;
  }

  // A route with permissions and no roles needs nothing else
  if (permissions && !roles) return true;

  // Reads the session: `null` without one
  const oSession: NanoObject | null = await (
    await forward(new Request(oReq.url, oInit), store, `${path}/get-session`)
  ).json();
  if (!oSession?.user) return false;

  // Allows any session without roles, and any of the user's roles with them
  const aUserRoles: string[] = String(oSession.user.role ?? '').split(',');
  return !roles || roles.some(sRole => aUserRoles.includes(sRole));
}
