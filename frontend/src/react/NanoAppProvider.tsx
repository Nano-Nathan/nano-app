'use client';

import { createContext, useRef } from 'react';
import StoreManager from '../stores/StoreManager';
import type { ReactNode } from 'react';
import type { StoreFiles } from '../types/store';

/** Stores of the tree, read by the components */
export const StoreContext = createContext<StoreManager | null>(null);

/** Root of the app's React tree: wraps the root layout and gives the tree its own stores */
export function NanoAppProvider({ children }: { children: ReactNode }): ReactNode {
  // Creates the stores once per tree, from the ones `withNanoApp` inlined at build time.
  // `process.env.NANO_APP_STORES` stays literal so Next can replace it.
  const oManagerRef = useRef<StoreManager | null>(null);
  oManagerRef.current ??= new StoreManager(
    JSON.parse(process.env.NANO_APP_STORES ?? '{}') as StoreFiles,
  );

  return <StoreContext value={oManagerRef.current}>{children}</StoreContext>;
}
