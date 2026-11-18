import { MantineProvider } from '@mantine/core';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { NanoAppProvider } from '@nano-app/frontend';
import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/** Urls the router went to */
export const aVisited: string[] = [];

/** Router of the app, keeping the urls it goes to */
export const oRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: sHref => aVisited.push(sHref),
  replace: () => {},
  prefetch: () => {},
  bfcacheId: '',
};

/** Mantine and the stores inside a router of the app, like the root layout of Next */
export default function TestApp({ children }: { children: ReactNode }): ReactNode {
  return (
    <AppRouterContext.Provider value={oRouter}>
      <MantineProvider env="test">
        <NanoAppProvider>{children}</NanoAppProvider>
      </MantineProvider>
    </AppRouterContext.Provider>
  );
}
