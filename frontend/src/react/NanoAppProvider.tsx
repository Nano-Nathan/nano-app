'use client';

import { createContext, use, useRef } from 'react';
import { useRouteLoaderData } from 'react-router';
import NanoError from '@nano-app/core/utils/NanoError';
import { MISSING_PROVIDER } from '../const';
import createStores from '../creators/createStores';
import type { ReactNode } from 'react';
import type { StoreFiles, Stores } from '../types/store';

/** Stores of the tree, read by the components */
const StoreContext = createContext<Stores | null>(null);

/** Root of the app's React tree: wraps the root layout and gives the tree its own stores */
export function NanoAppProvider({ children }: { children: ReactNode }): ReactNode {
  // Creates the stores once per tree, from the files the root loader gave
  const oData: { stores: StoreFiles } | undefined = useRouteLoaderData('root');
  const oStoresRef = useRef<Stores | null>(null);
  oStoresRef.current ??= createStores(oData?.stores ?? {});

  return <StoreContext value={oStoresRef.current}>{children}</StoreContext>;
}

/** Stores of the tree; fails outside the provider */
export function useStores(): Stores {
  // Reads the provider's stores
  const oStores = use(StoreContext);
  if (!oStores) throw new NanoError(MISSING_PROVIDER);

  return oStores;
}
