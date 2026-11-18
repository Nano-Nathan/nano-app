'use client';

import { createContext, use, useState } from 'react';
import { enableStaticRendering } from 'mobx-react-lite';
import { API_STORE_TYPE } from '@nano-app/core/const';
import NanoError from '@nano-app/core/utils/NanoError';
import { IS_SERVER, MISSING_PROVIDER } from '../const';
import { STORES } from '../defines/client';
import ApiStore from '../stores/ApiStore';
import Store from '../stores/Store';
import type { ReactNode } from 'react';
import type { Stores } from '../types/store';

// The server renders each component once: no MobX subscriptions there
enableStaticRendering(IS_SERVER);

/** Stores of the tree, read by the components */
const StoreContext = createContext<Stores | null>(null);

/** Root of the app's React tree: wraps the root layout and gives the tree its own stores, in the locale the user chose */
export function NanoAppProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale?: string;
}): ReactNode {
  const [oStores] = useState(() => {
    // Creates each store once per tree, an api store for its backend
    const oCreated = Object.fromEntries<any>(
      STORES.map(([sName, oFile]) => [
        sName,
        oFile.type === API_STORE_TYPE ? new ApiStore(sName, oFile.data) : new Store(oFile.data),
      ]),
    ) as Stores;

    // The user's locale over the app store's
    if (locale) oCreated.app.set('/locale', locale);
    return oCreated;
  });

  return <StoreContext value={oStores}>{children}</StoreContext>;
}

/** Stores of the tree; fails outside the provider */
export function useStores(): Stores {
  // Reads the provider's stores
  const oStores = use(StoreContext);
  if (!oStores) throw new NanoError(MISSING_PROVIDER);

  return oStores;
}
