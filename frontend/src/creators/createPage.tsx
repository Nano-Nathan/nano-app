import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AUTH_PATH } from '@nano-app/core/const';
import NanoError from '@nano-app/core/utils/NanoError';
import { API_NAME } from '../const';
import { URLS } from '../defines/server';
import type { ReactNode } from 'react';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { PageOptions, PageView } from '../types/page';

/** Better Auth's session at a backend for this request, asked once per render */
const getSession = cache(async (sUrl: string): Promise<NanoObject | null> => {
  // Asks the backend with the browser's cookie
  const sCookie = (await headers()).get('cookie') ?? '';
  const oRes = await fetch(`${sUrl}${AUTH_PATH}/get-session`, { headers: { cookie: sCookie } });

  // The session is the result of the backend's ApiResponse
  const { result }: ApiResponse<NanoObject | null> = await oRes.json();
  return result ?? null;
});

/** Page whose session at the store's backend is the one of `auth`: otherwise it redirects */
export default function createPage<P>(
  oOptions: PageOptions,
  fnView: PageView<P>,
): (oProps: P) => Promise<ReactNode> {
  const { store = API_NAME, auth = true, redirect: sRedirect } = oOptions;
  return async function Page(oProps: P): Promise<ReactNode> {
    // Fails when the store has no backend URL
    const sUrl = URLS.get(store);
    if (!sUrl) {
      throw new NanoError(
        `The page asks the session of the store "${store}", which has no backend URL. Define API_${store.toUpperCase()}_URL, and add src/stores/${store}.store.ts with type 'api' for a store other than ${API_NAME}.`,
      );
    }

    // Redirects unless the session is the one the page asks; the view gets it, `{}` without one
    const oSession = await getSession(sUrl);
    if (auth !== Boolean(oSession)) redirect(sRedirect);
    return fnView({ ...oProps, session: oSession ?? {} });
  };
}
