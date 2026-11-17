import { NextResponse } from 'next/server';
import Logger from '@nano-app/core/utils/Logger';
import { PROXY_PATH } from '../const';
import { MISSING_ENVS, URLS } from '../defines/server';
import type { NextRequest } from 'next/server';

/** Sends `/api/<store>/<path>` to the backend of the store; any other request goes on */
export function proxy(oReq: NextRequest): Response {
  // Only the proxy's path goes to a backend
  const { pathname, search } = oReq.nextUrl;
  if (!pathname.startsWith(`${PROXY_PATH}/`)) return NextResponse.next();

  // Answers 500 while a store has no URL
  if (MISSING_ENVS.length) {
    const sMessage = `The api stores need the environment variables ${MISSING_ENVS.join(', ')}. Define them.`;
    return NextResponse.json(
      { success: false, message: Logger.message('ERROR', sMessage) },
      { status: 500 },
    );
  }

  // The first segment names the store, the rest is the backend's path
  const [sName, ...aPath] = pathname.slice(PROXY_PATH.length + 1).split('/');
  const sUrl = URLS.get(sName);
  if (!sUrl) return NextResponse.next();

  // Next sends the request to the backend and answers
  return NextResponse.rewrite(`${sUrl}/${aPath.join('/')}${search}`);
}
