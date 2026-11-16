import { API_STORE_TYPE } from '@nano-app/core/const';
import NanoError from '@nano-app/core/utils/NanoError';
import { STORES } from '../defines/client';
import ApiStore from '../stores/ApiStore';
import Store from '../stores/Store';
import type { StoreFile, Stores } from '../types/store';

/** Stores of one React tree; reading one the app has not throws */
export default function createStores(): Stores {
  // Creates each store with its own state; `app` is among them, as `withNanoApp` adds it
  const oStores = Object.fromEntries(
    STORES.map(([sName, oFile]) => [sName, createStore(sName, oFile)]),
  ) as Stores;

  // Reading a store by a name the app does not have fails, naming the file to add
  return new Proxy(oStores, {
    get: (oTarget, oKey) => {
      if (typeof oKey === 'string' && !(oKey in oTarget)) {
        throw new NanoError(`The store "${oKey}" does not exist. Add src/stores/${oKey}.store.ts.`);
      }
      return Reflect.get(oTarget, oKey);
    },
  });
}

/** Store of one file: an api store reads its backend, any other keeps UI state */
function createStore(sName: string, oFile: StoreFile): Store {
  return oFile.type === API_STORE_TYPE ? new ApiStore(sName, oFile.data) : new Store(oFile.data);
}
