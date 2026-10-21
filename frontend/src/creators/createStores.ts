import { APP_NAME } from '@nano-app/core/const';
import Store from '../stores/Store';
import type { StoreFiles, Stores } from '../types/store';

/** Stores of one React tree, from the ones `withNanoApp` inlined at build time */
export default function createStores(): Stores {
  // `process.env.NANO_APP_STORES` stays literal so Next can replace it
  const oFiles: StoreFiles = JSON.parse(process.env.NANO_APP_STORES ?? '{}');

  // Creates each store with its own state
  const oStores = Object.fromEntries(
    Object.entries(oFiles).map(([sName, oFile]) => [sName, new Store(oFile.data)]),
  );

  // Adds an empty app store when the app has none
  return { ...oStores, [APP_NAME]: oStores[APP_NAME] ?? new Store() };
}
