import type { ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Options of `createPage`: the api store whose backend has Better Auth, and where to go without a session */
export type PageOptions = {
  /** Name of the api store whose backend answers the session, `api` by default */
  store?: string;
  /** Path the page redirects to without a session */
  redirect: string;
};

/** Renders the page with Next's props and Better Auth's session (`{ session, user }`) */
export type PageView<P> = (props: P & { session: NanoObject }) => ReactNode;
