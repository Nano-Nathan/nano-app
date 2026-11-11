import { NextRequest, NextResponse } from 'next/server';
import Logger from '@nano-app/core/utils/Logger';
import Paths from '@nano-app/core/utils/Paths';
import { HEADERS, ROUTES } from './utils/state';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { GuardedRoute, ProxyTarget } from './types/store';

/** Sends `/api/<store>/<path>` to the backend of `<store>`, in `API_<STORE>_URL`, with its headers; guards the pages of `auth.routes` */
export async function proxy(oReq: NextRequest): Promise<Response> {
  // A request outside `/api/<store>` is a page of the app
  const oTarget = target(oReq);
  if (!oTarget) return guard(oReq);

  // Answers 500 with the env var that is missing; their values never reach the browser
  if ('missing' in oTarget) {
    return NextResponse.json(
      {
        success: false,
        message: Logger.message(
          'ERROR',
          `The store "${oTarget.store}" needs the ${oTarget.missing} environment variable. Define it.`,
        ),
      },
      { status: 500 },
    );
  }

  // Next sends the same request (method, cookies, body) to the backend and answers with what it answers
  return NextResponse.rewrite(oTarget.url, { request: { headers: oTarget.headers } });
}

/** Where a request to `/api/<store>/<path>` goes: the URL of its backend and its headers, or the env var that is missing */
function target(oReq: NextRequest): ProxyTarget | undefined {
  // Reads the store named after `/api` (`/api/backend/users/7` → `backend`, `users/7`)
  const [, sPrefix, sName, ...aPath] = oReq.nextUrl.pathname.split('/');
  if (sPrefix !== 'api' || !sName) return undefined;

  // Names the env vars of the store: its URL and the one of each header
  const sUrlEnv = `API_${sName.toUpperCase()}_URL`;
  const aHeaders = HEADERS.get(sName) ?? [];

  // Finds the first env var that is not defined
  const sMissing = [sUrlEnv, ...aHeaders.map(([, sEnvName]) => sEnvName)].find(
    sEnvName => !process.env[sEnvName],
  );
  if (sMissing) return { store: sName, missing: sMissing };

  // Adds the store's headers over the browser's: the browser cannot replace them
  const oHeaders = new Headers(oReq.headers);
  for (const [sHeader, sEnvName] of aHeaders) oHeaders.set(sHeader, process.env[sEnvName] ?? '');

  // The URL of the backend with the path and the query of the request
  return {
    url: `${process.env[sUrlEnv]}/${aPath.join('/')}${oReq.nextUrl.search}`,
    headers: oHeaders,
  };
}

/** Lets a page through, or sends it to the `redirect` of its route when Better Auth does not allow it */
async function guard(oReq: NextRequest): Promise<Response> {
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
  // Finds the backend of the store, with the browser's cookie and the app's origin over its headers
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
