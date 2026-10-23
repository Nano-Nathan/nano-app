import { NextResponse } from 'next/server';
import { API_STORE_TYPE } from '@nano-app/core/const';
import readStoreFiles from './stores/readStoreFiles';
import type { NextRequest } from 'next/server';

/** Sends `/api/<store>/<path>` to the backend of the `api` store `<store>`, in `API_<STORE>_URL` */
export async function proxy(oReq: NextRequest): Promise<Response> {
  // Reads the store named after `/api` (`/api/backend/users/7` → `backend`, `users/7`)
  const [, sPrefix, sName, ...aPath] = oReq.nextUrl.pathname.split('/');
  const isApiStore = sPrefix === 'api' && readStoreFiles()[sName]?.type === API_STORE_TYPE;

  // Any other request goes on to the app's own routes
  if (!isApiStore) return NextResponse.next();

  // Reads the backend URL at runtime, on the server: it never reaches the browser
  const sEnvName = `API_${sName.toUpperCase()}_URL`;
  const sUrl = process.env[sEnvName];
  if (!sUrl) {
    return NextResponse.json(
      {
        success: false,
        message: `[nano-app] [ERROR] The store "${sName}" has no backend URL. Define the ${sEnvName} environment variable.`,
      },
      { status: 500 },
    );
  }

  // Sends the same request (method, headers, cookies, body) from the server, so the URL never
  // reaches the browser; a redirect goes back to the browser as is
  const sTarget = `${sUrl}/${aPath.join('/')}${oReq.nextUrl.search}`;
  const oRes = await fetch(new Request(sTarget, oReq), { redirect: 'manual' });

  // Answers with a copy: Next adds its headers, and the ones of `fetch` are read-only
  return new Response(oRes.body, oRes);
}
