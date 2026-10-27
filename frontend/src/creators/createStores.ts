import { API_STORE_TYPE, APP_NAME } from '@nano-app/core/const';
import ApiStore from '../stores/ApiStore';
import AuthStore from '../stores/AuthStore';
import Store from '../stores/Store';
import STORE_FILES from '../stores/storeFiles';
import type { StoreFile, Stores } from '../types/store';

/** Stores of one React tree, from the ones `withNanoApp` inlined at build time */
export default function createStores(): Stores {
  // Creates each store with its own state
  const oStores = Object.fromEntries(
    Object.entries(STORE_FILES).map(([sName, oFile]) => [sName, createStore(sName, oFile)]),
  );

  // The app store is always a store of UI state, empty when the app has none
  return { ...oStores, [APP_NAME]: new Store(STORE_FILES[APP_NAME]?.data) };
}

/** Store of one file: an api store reads its backend, with Better Auth when it declares `auth` */
function createStore(sName: string, oFile: StoreFile): Store {
  // A store of UI state
  if (oFile.type !== API_STORE_TYPE) return new Store(oFile.data);

  // An api store with Better Auth at its base path
  if (oFile.auth) return new AuthStore(sName, oFile.auth, oFile.data);

  // An api store
  return new ApiStore(sName, oFile.data);
}
