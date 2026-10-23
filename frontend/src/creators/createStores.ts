import { APP_NAME } from '@nano-app/core/const';
import Store from '../stores/Store';
import readStoreFiles from '../stores/readStoreFiles';
import type { Stores } from '../types/store';

/** Stores of one React tree, from the ones `withNanoApp` inlined at build time */
export default function createStores(): Stores {
  // Creates each store with its own state
  const oStores = Object.fromEntries(
    Object.entries(readStoreFiles()).map(([sName, oFile]) => [sName, new Store(oFile.data)]),
  );

  // Adds an empty app store when the app has none
  return { ...oStores, [APP_NAME]: oStores[APP_NAME] ?? new Store() };
}
