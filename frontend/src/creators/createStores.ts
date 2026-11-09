import { API_STORE_TYPE, APP_NAME } from '@nano-app/core/const';
import NanoError from '@nano-app/core/utils/NanoError';
import ApiStore from '../stores/ApiStore';
import AuthStore from '../stores/AuthStore';
import Store from '../stores/Store';
import { STORES } from '../utils/state';
import type { StoreFile } from '@nano-app/core/types/store';
import type { Stores } from '../types/store';

/** Stores of one React tree, from the ones `withNanoApp` inlined at build time; reading one the app has not throws */
export default function createStores(): Stores {
  // Creates each store with its own state
  const oStores = Object.fromEntries(
    [...STORES].map(([sName, oFile]) => [sName, createStore(sName, oFile)]),
  );

  // The app store is always a store of UI state, empty when the app has none
  const oAll = { ...oStores, [APP_NAME]: new Store(STORES.get(APP_NAME)?.data) };

  // Reading a store by a name the app does not have fails, naming the file to add
  return new Proxy(oAll, {
    get: (oTarget, oKey) => {
      if (typeof oKey === 'string' && !(oKey in oTarget)) {
        throw new NanoError(`The store "${oKey}" does not exist. Add src/stores/${oKey}.store.ts.`);
      }
      return Reflect.get(oTarget, oKey);
    },
  });
}

/** Store of one file: an api store reads its backend, with Better Auth when it declares `auth` */
function createStore(sName: string, oFile: StoreFile): Store {
  // A store of UI state
  if (oFile.type !== API_STORE_TYPE) return new Store(oFile.data);

  // An api store with Better Auth at its base path
  if (oFile.auth) return new AuthStore(sName, oFile.auth.path, oFile.data);

  // An api store
  return new ApiStore(sName, oFile.data);
}
