import { Readable } from 'node:stream';
import { createPlugin } from '@nano-app/backend';
import { API_STORE_TYPE, DEFAULT_STORE } from '@nano-app/core/const';
import Logger from '@nano-app/core/utils/Logger';
import { PROXY_PATH } from '../const';
import type { Request, Response } from 'express';
import type { StoreFiles } from '../types/store';

/** Headers of the backend's answer that do not go back: fetch already decoded and measured it */
const DROPPED = ['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie'];

/** Sends `/api[/<store>]/<path>` to the backend of the store; any other request goes on */
export default createPlugin((options?: { stores: StoreFiles }) => {
  // The stores of the app, by name
  const oStores = options?.stores ?? {};

  return {
    name: 'proxy',
    middlewares: [
      (oReq, oRes, fnNext) => {
        // Only the proxy's path goes to a backend
        if (!oReq.path.startsWith(`${PROXY_PATH}/`)) return fnNext();
        return forward(oReq, oRes, oStores);
      },
    ],
  };
});

/** Sends the request to the backend of its store and pipes its answer back */
async function forward(oReq: Request, oRes: Response, oStores: StoreFiles): Promise<void> {
  // The store of the path: an api store by name, or the default one with the whole path
  const aSegments = oReq.path.slice(PROXY_PATH.length + 1).split('/');
  const isNamed = aSegments[0] !== DEFAULT_STORE && oStores[aSegments[0]]?.type === API_STORE_TYPE;
  const [sName, aPath] = isNamed ? [aSegments[0], aSegments.slice(1)] : [DEFAULT_STORE, aSegments];

  // Its env vars: its URL and the one of each header
  const sUrlEnv = sName === DEFAULT_STORE ? 'API_URL' : `API_${sName.toUpperCase()}_URL`;
  const aHeaders = Object.entries(oStores[sName]?.headers ?? {}).map(([sHeader, sValue]) => [
    sHeader,
    `API_${sValue.toUpperCase()}_HEADER`,
  ]);

  // Answers 500 with the first env var that is missing
  const sMissing = [sUrlEnv, ...aHeaders.map(([, sEnvName]) => sEnvName)].find(
    sEnvName => !process.env[sEnvName],
  );
  if (sMissing) {
    const sMessage = `The store "${sName}" needs the ${sMissing} environment variable. Define it.`;
    oRes.status(500).json({ success: false, message: Logger.message('ERROR', sMessage) });
    return;
  }

  // The browser's headers, with the store's over them: the browser cannot replace them
  const headers = new Headers();
  for (const [sKey, sValue] of Object.entries(oReq.headers)) {
    if (sKey !== 'host' && typeof sValue === 'string') headers.set(sKey, sValue);
  }
  for (const [sHeader, sEnvName] of aHeaders) headers.set(sHeader, process.env[sEnvName] ?? '');

  // Sends it to the backend with the path, the query and the body as they came
  const sSearch = oReq.url.slice(oReq.path.length);
  const isBody = oReq.method !== 'GET' && oReq.method !== 'HEAD';
  const oAnswer = await fetch(`${process.env[sUrlEnv]}/${aPath.join('/')}${sSearch}`, {
    method: oReq.method,
    headers,
    body: isBody ? (Readable.toWeb(oReq) as ReadableStream) : undefined,
    redirect: 'manual',
    // @ts-expect-error: Node's fetch needs it to send a stream
    duplex: 'half',
  });

  // Answers with its status, headers, cookies and body
  oRes.status(oAnswer.status);
  oAnswer.headers.forEach((sValue, sKey) => {
    if (!DROPPED.includes(sKey)) oRes.setHeader(sKey, sValue);
  });
  const aCookies = oAnswer.headers.getSetCookie();
  if (aCookies.length) oRes.setHeader('set-cookie', aCookies);
  if (!oAnswer.body) return void oRes.end();
  Readable.fromWeb(oAnswer.body as any).pipe(oRes);
}
