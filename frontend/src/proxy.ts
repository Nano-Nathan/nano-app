import { NextResponse } from 'next/server';
import { API_STORE_TYPE } from '@nano-app/core/const';
import Logger from '@nano-app/core/utils/Logger';
import { PROXY_PATH } from './const';
import { STORES } from './utils/state';
import type { NextRequest } from 'next/server';

/** Env var with the backend URL of each api store (`admin_users` → `API_ADMIN_USERS_URL`) */
const URL_ENVS = [...STORES]
  .filter(([, { type }]) => type === API_STORE_TYPE)
  .map(([sName]) => [sName, `API_${sName.toUpperCase()}_URL`]);

/** Backend URL of each api store, read from the env once */
const URLS = new Map(URL_ENVS.map(([sName, sEnvName]) => [sName, process.env[sEnvName]]));

/** Env vars of the api stores that are not defined */
const MISSING_ENVS = URL_ENVS.filter(([sName]) => !URLS.get(sName)).map(([, sEnvName]) => sEnvName);

/** Error of every request to a backend while an env var is missing */
const MISSING_ERROR = Logger.message(
  'ERROR',
  `The api stores need the environment variables ${MISSING_ENVS.join(', ')}. Define them.`,
);

/** Sends `/api/<store>/<path>` to the backend of the store; any other request goes on */
export function proxy(oReq: NextRequest): Response {
  // Only the proxy's path goes to a backend
  const { pathname, search } = oReq.nextUrl;
  if (!pathname.startsWith(`${PROXY_PATH}/`)) return NextResponse.next();

  // Answers 500 while a store has no URL
  if (MISSING_ENVS.length) {
    return NextResponse.json({ success: false, message: MISSING_ERROR }, { status: 500 });
  }

  // The first segment names the store, the rest is the backend's path
  const [sName, ...aPath] = pathname.slice(PROXY_PATH.length + 1).split('/');
  const sUrl = URLS.get(sName);
  if (!sUrl) return NextResponse.next();

  // Next sends the request to the backend and answers
  return NextResponse.rewrite(`${sUrl}/${aPath.join('/')}${search}`);
}
