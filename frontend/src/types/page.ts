import type { ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Options of `createPage`: the api store whose backend has Better Auth, the session it asks, and where to go otherwise */
export type PageOptions = {
  /** Name of the api store whose backend answers the session, `api` by default */
  store?: string;
  /** Whether the page needs a session (`true` by default) or needs none (`false`, a login) */
  auth?: boolean;
  /** Path the page redirects to when the session is not the one it asks */
  redirect: string;
};

/** Renders the page with Next's props and Better Auth's session (`{ session, user }`, `{}` with `auth: false`) */
export type PageView<P> = (props: P & { session: NanoObject }) => ReactNode;
