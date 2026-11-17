import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AUTH_PATH } from '@nano-app/core/const';
import NanoError from '@nano-app/core/utils/NanoError';
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
  return async function Page(oProps: P): Promise<ReactNode> {
    // Fails when the store has no backend URL
    const sUrl = URLS.get(oOptions.store);
    if (!sUrl) {
      throw new NanoError(
        `The page asks the session of the store "${oOptions.store}", which has no backend URL. Add src/stores/${oOptions.store}.store.ts with type 'api' and define its API_${oOptions.store.toUpperCase()}_URL.`,
      );
    }

    // Without a session the page redirects; with one the view gets it
    const oSession = await getSession(sUrl);
    if (!oSession) redirect(oOptions.redirect);
    return fnView({ ...oProps, session: oSession });
  };
}
