import { API_STORE_TYPE, APP_NAME } from '@nano-app/core/const';
import ApiStore from '../stores/ApiStore';
import Store from '../stores/Store';
import type { StoreFiles, Stores } from '../types/store';

/** Stores of one React tree, from the ones `withNanoApp` inlined at build time */
export default function createStores(): Stores {
  // `process.env.NANO_APP_STORES` stays literal so Next can replace it
  const oFiles: StoreFiles = JSON.parse(process.env.NANO_APP_STORES ?? '{}');

  // Creates each store with its own state: an api store reads its backend
  const oStores = Object.fromEntries(
    Object.entries(oFiles).map(([sName, oFile]) => {
      const isApi = oFile.type === API_STORE_TYPE;
      return [sName, isApi ? new ApiStore(sName) : new Store(oFile.data)];
    }),
  );

  // The app store is always a store of UI state, empty when the app has none
  return { ...oStores, [APP_NAME]: new Store(oFiles[APP_NAME]?.data) };
}
