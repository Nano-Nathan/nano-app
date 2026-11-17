import { render } from '@testing-library/react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { NanoAppProvider } from '../src/app/NanoAppProvider';
import Controller from '../src/controllers/Controller';
import createView from '../src/creators/createView';
import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { Stores } from '../src/types/store';

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

/** Stores of a rendered tree, as a controller gets them */
export function renderStores(): Stores {
  // Renders a view that keeps the stores of its controller
  let oStores = {} as Stores;
  const Grab = createView(Controller, oController => {
    oStores = oController.stores;
    return null;
  });
  render(
    <TestApp>
      <Grab />
    </TestApp>,
  );
  return oStores;
}
