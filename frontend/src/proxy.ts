import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_REDIRECT } from '@nano-app/core/const';
import Formatter from '@nano-app/core/utils/Formatter';
import Paths from '@nano-app/core/utils/Paths';
import Validator from '@nano-app/core/utils/Validator';
import STORE_FILES from './stores/storeFiles';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { AuthRoute } from './types/store';

/** Sends `/api/<store>/<path>` to the backend of `<store>`, in `API_<STORE>_URL`, with its headers; guards the pages of `auth.routes` */
export async function proxy(oReq: NextRequest): Promise<Response> {
  // Reads the store named after `/api` (`/api/backend/users/7` → `backend`, `users/7`)
  const [, sPrefix, sName, ...aPath] = oReq.nextUrl.pathname.split('/');

  // A request outside `/api/<store>` is a page of the app
  if (sPrefix !== 'api' || !sName) return guard(oReq);

  // Names the env vars of the store: its URL and one per header (`STRIPE_KEY` → `API_STRIPE_KEY_HEADER`)
  const sUrlEnv = `API_${sName.toUpperCase()}_URL`;
  const aHeaders = Object.entries(STORE_FILES[sName]?.headers ?? {}).map(([sHeader, sValue]) => [
    sHeader,
    `API_${sValue.toUpperCase()}_HEADER`,
  ]);

  // Answers 500 with the first env var that is missing; their values never reach the browser
  const sMissing = Validator.missingEnv([sUrlEnv, ...aHeaders.map(([, sEnvName]) => sEnvName)]);
  if (sMissing) {
    return NextResponse.json(
      {
        success: false,
        message: Formatter.message(
          'ERROR',
          `The store "${sName}" needs the ${sMissing} environment variable. Define it.`,
        ),
      },
      { status: 500 },
    );
  }

  // Adds the store's headers over the browser's: the browser cannot replace them
  const oHeaders = new Headers(oReq.headers);
  for (const [sHeader, sEnvName] of aHeaders) oHeaders.set(sHeader, process.env[sEnvName] ?? '');

  // Sends the same request (method, cookies, body) from the server; a redirect goes back as is
  const sTarget = `${process.env[sUrlEnv]}/${aPath.join('/')}${oReq.nextUrl.search}`;
  const oRes = await fetch(new Request(sTarget, oReq), { headers: oHeaders, redirect: 'manual' });

  // Answers with a copy: Next adds its headers, and the ones of `fetch` are read-only
  return new Response(oRes.body, oRes);
}

/** Lets a page through, or sends it to the `redirect` of its route when Better Auth does not allow it */
async function guard(oReq: NextRequest): Promise<Response> {
  // Finds the first route of the page across the stores with `auth`
  for (const [sName, { auth }] of Object.entries(STORE_FILES)) {
    const oRoute = auth?.routes?.find(oItem => Paths.matches(oItem.match, oReq.nextUrl.pathname));
    if (!auth || !oRoute) continue;

    // Lets the page through when Better Auth allows it, and redirects it otherwise
    if (await allows(oReq, `/api/${sName}${auth.path}`, oRoute)) return NextResponse.next();
    return NextResponse.redirect(new URL(oRoute.redirect ?? DEFAULT_REDIRECT, oReq.url));
  }

  // A page without a route is public
  return NextResponse.next();
}

/** Whether Better Auth allows the request: a session, any of the roles and every permission */
async function allows(oReq: NextRequest, sAuthPath: string, oRoute: AuthRoute): Promise<boolean> {
  const { roles, permissions } = oRoute;

  // Reads the session: `null` without one
  const oSession = await ask(oReq, `${sAuthPath}/get-session`);
  if (!oSession?.user) return false;

  // Needs any of the roles, separated by commas as Better Auth keeps them
  const aUserRoles: string[] = String(oSession.user.role ?? '').split(',');
  if (roles && !roles.split(',').some(sRole => aUserRoles.includes(sRole))) return false;

  // Needs every permission, checked by the admin plugin
  if (!permissions) return true;
  const oPermissions = Object.fromEntries(
    Object.entries(permissions).map(([sResource, sActions]) => [sResource, sActions.split(',')]),
  );
  const oCheck = await ask(oReq, `${sAuthPath}/admin/has-permission`, {
    permissions: oPermissions,
  });
  return oCheck?.success === true;
}

/** Answer of Better Auth through this proxy, with the browser's cookie and the app's origin */
async function ask(oReq: NextRequest, sPath: string, oBody?: unknown): Promise<NanoObject | null> {
  // Sends a `GET`, or a `POST` with a body
  const sMethod = oBody ? 'POST' : 'GET';
  const oRes = await proxy(
    new NextRequest(new URL(sPath, oReq.url), {
      method: sMethod,
      body: JSON.stringify(oBody),
      headers: {
        cookie: oReq.headers.get('cookie') ?? '',
        origin: oReq.nextUrl.origin,
        'content-type': 'application/json',
      },
    }),
  );
  return oRes.json();
}
