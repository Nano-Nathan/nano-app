import { NextResponse } from 'next/server';
import STORE_FILES from './stores/storeFiles';
import type { NextRequest } from 'next/server';

/** Sends `/api/<store>/<path>` to the backend of `<store>`, in `API_<STORE>_URL`, with its headers */
export async function proxy(oReq: NextRequest): Promise<Response> {
  // Reads the store named after `/api` (`/api/backend/users/7` → `backend`, `users/7`)
  const [, sPrefix, sName, ...aPath] = oReq.nextUrl.pathname.split('/');

  // A request outside `/api/<store>` goes on to the app's own routes
  if (sPrefix !== 'api' || !sName) return NextResponse.next();

  // Names the env vars of the store: its URL and one per header (`STRIPE_KEY` → `API_STRIPE_KEY_HEADER`)
  const sUrlEnv = `API_${sName.toUpperCase()}_URL`;
  const aHeaders = Object.entries(STORE_FILES[sName]?.headers ?? {}).map(([sHeader, sValue]) => [
    sHeader,
    `API_${sValue.toUpperCase()}_HEADER`,
  ]);

  // Answers 500 with the first env var that is missing; their values never reach the browser
  const sMissing = [sUrlEnv, ...aHeaders.map(([, sEnvName]) => sEnvName)].find(
    sEnvName => !process.env[sEnvName],
  );
  if (sMissing) {
    return NextResponse.json(
      {
        success: false,
        message: `[nano-app] [ERROR] The store "${sName}" needs the ${sMissing} environment variable. Define it.`,
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
