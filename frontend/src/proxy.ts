import { NextResponse } from 'next/server';
import ProxyEnv from './proxy/ProxyEnv';
import type { NextRequest } from 'next/server';

/** Sends `/api/<store>/<path>` to the backend of `<store>`, in `API_<STORE>_URL`, with its headers */
export async function proxy(oReq: NextRequest): Promise<Response> {
  // Reads the store named after `/api` (`/api/backend/users/7` → `backend`, `users/7`)
  const [, sPrefix, sName, ...aPath] = oReq.nextUrl.pathname.split('/');

  // A request outside `/api/<store>` goes on to the app's own routes
  if (sPrefix !== 'api' || !sName) return NextResponse.next();

  // Reads the store's backend, on the server: its URL and keys never reach the browser
  const oTarget = ProxyEnv.resolve(sName);
  if ('missing' in oTarget) {
    return NextResponse.json(
      {
        success: false,
        message: `[nano-app] [ERROR] The store "${sName}" needs the ${oTarget.missing} environment variable. Define it.`,
      },
      { status: 500 },
    );
  }

  // Adds the store's headers over the browser's: the browser cannot replace them
  const oHeaders = new Headers(oReq.headers);
  for (const [sHeader, sValue] of Object.entries(oTarget.headers)) oHeaders.set(sHeader, sValue);

  // Sends the same request (method, cookies, body) from the server; a redirect goes back as is
  const sTarget = `${oTarget.url}/${aPath.join('/')}${oReq.nextUrl.search}`;
  const oRes = await fetch(new Request(sTarget, oReq), { headers: oHeaders, redirect: 'manual' });

  // Answers with a copy: Next adds its headers, and the ones of `fetch` are read-only
  return new Response(oRes.body, oRes);
}
