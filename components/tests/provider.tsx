import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { NanoAppProvider } from '@nano-app/frontend';
import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Router of the app that goes nowhere
const oRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  bfcacheId: '',
};

/** The provider inside a router of the app, like the root layout of Next */
export default function TestApp({ children }: { children: ReactNode }): ReactNode {
  return (
    <AppRouterContext.Provider value={oRouter}>
      <NanoAppProvider>{children}</NanoAppProvider>
    </AppRouterContext.Provider>
  );
}
