import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AUTH_PATH } from '@nano-app/core/const';
import NanoError from '@nano-app/core/utils/NanoError';
import { API_NAME } from '../const';
import { URLS } from '../defines/server';
import type { ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { PageOptions, PageView } from '../types/page';

/** Better Auth's session at a backend for this request, asked once per render */
const getSession = cache(async (sUrl: string): Promise<NanoObject | null> => {
  // Asks the backend with the browser's cookie
  const sCookie = (await headers()).get('cookie') ?? '';
  const oRes = await fetch(`${sUrl}${AUTH_PATH}/get-session`, { headers: { cookie: sCookie } });
  return oRes.json();
});

/** Page that needs a session at the store's backend: without one it redirects */
export default function createPage<P>(
  oOptions: PageOptions,
  fnView: PageView<P>,
): (oProps: P) => Promise<ReactNode> {
  const { store = API_NAME, redirect: sRedirect } = oOptions;
  return async function Page(oProps: P): Promise<ReactNode> {
    // Fails when the store has no backend URL
    const sUrl = URLS.get(store);
    if (!sUrl) {
      throw new NanoError(
        `The page asks the session of the store "${store}", which has no backend URL. Define API_${store.toUpperCase()}_URL, and add src/stores/${store}.store.ts with type 'api' for a store other than ${API_NAME}.`,
      );
    }

    // Without a session the page redirects; with one the view gets it
    const oSession = await getSession(sUrl);
    if (!oSession) redirect(sRedirect);
    return fnView({ ...oProps, session: oSession });
  };
}
