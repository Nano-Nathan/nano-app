import { NextResponse } from 'next/server';
import { API_STORE_TYPE, DEFAULT_STORE } from '@nano-app/core/const';
import Logger from '@nano-app/core/utils/Logger';
import { PROXY_PATH } from './const';
import { STORES } from './utils/state';
import type { NextRequest } from 'next/server';

/** Headers the proxy adds per store, each with the env var of its value (`KEY` → `API_KEY_HEADER`) */
const HEADERS = new Map(
  [...STORES].map(([sName, { headers = {} }]) => [
    sName,
    Object.entries(headers).map(([sHeader, sValue]) => [
      sHeader,
      `API_${sValue.toUpperCase()}_HEADER`,
    ]),
  ]),
);

/** Sends `/api[/<store>]/<path>` to the backend of the store; any other request goes on */
export function proxy(oReq: NextRequest): Response {
  // Only the proxy's path goes to a backend
  const { pathname, search } = oReq.nextUrl;
  if (!pathname.startsWith(`${PROXY_PATH}/`)) return NextResponse.next();

  // The store of the path: an api store by name, or the default one with the whole path
  const aSegments = pathname.slice(PROXY_PATH.length + 1).split('/');
  const isNamed =
    aSegments[0] !== DEFAULT_STORE && STORES.get(aSegments[0])?.type === API_STORE_TYPE;
  const [sName, aPath] = isNamed ? [aSegments[0], aSegments.slice(1)] : [DEFAULT_STORE, aSegments];

  // Its env vars: its URL and the one of each header
  const sUrlEnv = sName === DEFAULT_STORE ? 'API_URL' : `API_${sName.toUpperCase()}_URL`;
  const aHeaders = HEADERS.get(sName) ?? [];

  // Answers 500 with the first env var that is missing
  const sMissing = [sUrlEnv, ...aHeaders.map(([, sEnvName]) => sEnvName)].find(
    sEnvName => !process.env[sEnvName],
  );
  if (sMissing) {
    const sMessage = `The store "${sName}" needs the ${sMissing} environment variable. Define it.`;
    return NextResponse.json(
      { success: false, message: Logger.message('ERROR', sMessage) },
      { status: 500 },
    );
  }

  // Adds the store's headers over the browser's: the browser cannot replace them
  const headers = new Headers(oReq.headers);
  for (const [sHeader, sEnvName] of aHeaders) headers.set(sHeader, process.env[sEnvName] ?? '');

  // Next sends the request to the backend and answers
  const sUrl = `${process.env[sUrlEnv]}/${aPath.join('/')}${search}`;
  return NextResponse.rewrite(sUrl, { request: { headers } });
}
