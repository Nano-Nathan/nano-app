'use client';

import { createContext, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MISSING_PROVIDER } from '@nano-app/core/const';
import createStores from '../creators/createStores';
import type { ReactNode } from 'react';
import type { Stores } from '../types/store';

/** Stores of the tree, read by the components */
const StoreContext = createContext<Stores | null>(null);

/** Root of the app's React tree: wraps the root layout and gives the tree its own stores */
export function NanoAppProvider({ children }: { children: ReactNode }): ReactNode {
  // Creates the stores once per tree; a 401 refreshes the page with Next's router
  const oRouter = useRouter();
  const oStoresRef = useRef<Stores | null>(null);
  oStoresRef.current ??= createStores(() => oRouter.refresh());

  return <StoreContext value={oStoresRef.current}>{children}</StoreContext>;
}

/** Stores of the tree; fails outside the provider */
export function useStores(): Stores {
  // Reads the provider's stores
  const oStores = use(StoreContext);
  if (!oStores) throw new Error(MISSING_PROVIDER);

  return oStores;
}
