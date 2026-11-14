import { createPlugin } from '@nano-app/backend';
import { SECURITY_HEADERS } from '../const';
import { storesContext } from '../react/stores';
import type { RequestHandler } from 'express';
import type { RouterContext, ServerBuild } from 'react-router';
import type { StoreFiles } from '../types/store';

/** Build of React Router's app, from `react-router build` */
const BUILD = 'build';

/** The pages of the app with React Router: Vite compiles them in development, the build in production */
export default createPlugin((options?: { stores: StoreFiles }) => {
  // React Router's handlers, ready once: Vite or the build
  const oStores = options?.stores ?? {};
  const isProduction = process.env.NODE_ENV === 'production';
  const oReady = isProduction ? production(oStores) : development(oStores);

  return {
    name: 'frontend',
    middlewares: [
      (oReq, oRes, fnNext) => {
        // The security headers of every page, then React Router once it is ready
        for (const { key, value } of SECURITY_HEADERS) oRes.setHeader(key, value);
        return oReady.then(fnRun => fnRun(oReq, oRes, fnNext));
      },
    ],
  };
});

/** Vite in middleware mode, and React Router rendering the app it compiles */
async function development(oStores: StoreFiles): Promise<RequestHandler> {
  // Vite is a dependency of the app in development: imported only there
  const { createServer } = await import('vite');

  // Compiles the app and nano-app with it, so both read the same React Router
  const oVite = await createServer({
    server: { middlewareMode: true },
    ssr: { noExternal: ['@nano-app/frontend'] },
  });

  // The context of the stores as the compiled app reads it
  const { storesContext: oContext } = await oVite.ssrLoadModule('@nano-app/frontend');
  const fnRender = await render(
    () => oVite.ssrLoadModule('virtual:react-router/server-build') as Promise<ServerBuild>,
    oContext,
    oStores,
  );
  return chain(oVite.middlewares, fnRender);
}

/** The built assets, and React Router rendering the built server */
async function production(oStores: StoreFiles): Promise<RequestHandler> {
  // Express serves what `react-router build` wrote
  const { default: express } = await import('express');
  const { resolve } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const oBuild = await import(pathToFileURL(resolve(BUILD, 'server/index.js')).href);
  const fnRender = await render(oBuild, storesContext, oStores);
  return chain(express.static(resolve(BUILD, 'client')), fnRender);
}

/** React Router's handler, with the stores in the context of every request */
async function render(
  build: ServerBuild | (() => Promise<ServerBuild>),
  oContext: RouterContext<StoreFiles>,
  oStores: StoreFiles,
): Promise<RequestHandler> {
  // React Router is a dependency of the app: imported when it starts
  const { createRequestHandler } = await import('@react-router/express');
  const { RouterContextProvider } = await import('react-router');
  return createRequestHandler({
    build,
    getLoadContext: () => new RouterContextProvider(new Map([[oContext, oStores]])),
  });
}

/** Two handlers as one: the second runs when the first passes the request on */
function chain(fnFirst: RequestHandler, fnSecond: RequestHandler): RequestHandler {
  return (oReq, oRes, fnNext) =>
    fnFirst(oReq, oRes, oError => (oError ? fnNext(oError) : fnSecond(oReq, oRes, fnNext)));
}
