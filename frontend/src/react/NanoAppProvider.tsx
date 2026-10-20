'use client';

import { createContext, useContext, useRef } from 'react';
import StoreManager from '../stores/StoreManager';
import StoreLoader from '../stores/StoreLoader';
import type { ReactNode } from 'react';

const StoreContext = createContext<StoreManager | null>(null);

/** Gives its React tree its own stores, from the app's `*.store.ts` */
export function NanoAppProvider({ children }: { children: ReactNode }): ReactNode {
  // Creates the stores once per tree: on the server, once per request
  const oManagerRef = useRef<StoreManager | null>(null);
  oManagerRef.current ??= new StoreManager(StoreLoader.load());

  return <StoreContext.Provider value={oManagerRef.current}>{children}</StoreContext.Provider>;
}

/** The stores of the current tree */
export function useStoreManager(): StoreManager {
  // Fails with the fix when there is no provider above
  const oManager = useContext(StoreContext);
  if (!oManager) {
    throw new Error(
      '[nano-app] [ERROR] The nano-app hooks need <NanoAppProvider> above them. Wrap the root layout with it.',
    );
  }

  return oManager;
}
