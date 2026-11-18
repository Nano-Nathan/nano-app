import { NextResponse } from 'next/server';
import Logger from '@nano-app/core/utils/Logger';
import { PROXY_PATH } from '../const';
import { ENVS, URLS } from '../defines/server';
import type { NextRequest } from 'next/server';

/** Sends `/api/<store>/<path>` to the backend of the store; any other request goes on */
export function proxy(oReq: NextRequest): Response {
  // Only the proxy's path goes to a backend
  const { pathname, search } = oReq.nextUrl;
  if (!pathname.startsWith(`${PROXY_PATH}/`)) return NextResponse.next();

  // The first segment names the store, the rest is the backend's path; no store goes on
  const [sName, ...aPath] = pathname.slice(PROXY_PATH.length + 1).split('/');
  if (!URLS.has(sName)) return NextResponse.next();

  // Answers 500 while the store has no URL
  const sUrl = URLS.get(sName);
  if (!sUrl) {
    const sMessage = `The api store "${sName}" needs the environment variable ${ENVS.get(sName)}. Define it.`;
    return NextResponse.json(
      { success: false, message: Logger.message('ERROR', sMessage) },
      { status: 500 },
    );
  }

  // Next sends the request to the backend and answers
  return NextResponse.rewrite(`${sUrl}/${aPath.join('/')}${search}`);
}
