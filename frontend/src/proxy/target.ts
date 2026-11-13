import { PROXY_PATH } from '../const';
import { urlEnv } from './env';
import { HEADERS } from './state';
import type { NextRequest } from 'next/server';
import type { ProxyTarget } from '../types/proxy';

/** The backend URL and headers of a request, or the env var that is missing */
export default function target(oReq: NextRequest): ProxyTarget | undefined {
  // Reads the store named after the proxy's path
  const { pathname } = oReq.nextUrl;
  if (!pathname.startsWith(`${PROXY_PATH}/`)) return undefined;
  const [sName, ...aPath] = pathname.slice(PROXY_PATH.length + 1).split('/');
  if (!sName) return undefined;

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
