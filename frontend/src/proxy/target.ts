import { API_STORE_TYPE, DEFAULT_STORE } from '@nano-app/core/const';
import { PROXY_PATH } from '../const';
import { STORES } from '../utils/state';
import { urlEnv } from './env';
import { HEADERS } from './state';
import type { NextRequest } from 'next/server';
import type { ProxyTarget } from '../types/proxy';

/** The backend URL and headers of a request, or the env var that is missing */
export default function target(oReq: NextRequest): ProxyTarget | undefined {
  // Only the proxy's path goes to a backend
  const { pathname } = oReq.nextUrl;
  if (!pathname.startsWith(`${PROXY_PATH}/`)) return undefined;

  // The store of the path: an api store by name, or the default one with the whole path
  const aSegments = pathname.slice(PROXY_PATH.length + 1).split('/');
  const isNamed =
    aSegments[0] !== DEFAULT_STORE && STORES.get(aSegments[0])?.type === API_STORE_TYPE;
  const [sName, aPath] = isNamed ? [aSegments[0], aSegments.slice(1)] : [DEFAULT_STORE, aSegments];

  // Names the env vars of the store: its URL and the one of each header
  const sUrlEnv = urlEnv(sName);
  const aHeaders = HEADERS.get(sName) ?? [];

  // Finds the first env var that is not defined
  const sMissing = [sUrlEnv, ...aHeaders.map(([, sEnvName]) => sEnvName)].find(
    sEnvName => !process.env[sEnvName],
  );
  if (sMissing) return { store: sName, missing: sMissing };

  // Adds the store's headers over the browser's: the browser cannot replace them
  const headers = new Headers(oReq.headers);
  for (const [sHeader, sEnvName] of aHeaders) headers.set(sHeader, process.env[sEnvName] ?? '');

  // The URL of the backend with the path and the query of the request
  return {
    url: `${process.env[sUrlEnv]}/${aPath.join('/')}${oReq.nextUrl.search}`,
    headers,
  };
}
