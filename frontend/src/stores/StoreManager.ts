import { APP_NAME, APP_STORE_TYPE } from '@nano-app/core/const';
import Store from './Store';
import type { StoreFiles } from '../types/store';

/** The stores of one React tree, by name */
export default class StoreManager {
  private oStores = new Map<string, Store>();

  /** Creates a store per file, plus an empty `app` store when the app has none */
  constructor(oFiles: StoreFiles) {
    // Adds the default app store
    const oAllFiles: StoreFiles = { [APP_NAME]: { type: APP_STORE_TYPE }, ...oFiles };

    // Creates each store with its own state
    for (const [sName, oFile] of Object.entries(oAllFiles)) {
      this.oStores.set(sName, new Store(oFile.data));
    }
  }

  /** The store with that name */
  public getStore(sName: string): Store {
    // Fails with the file to create when it does not exist
    const oStore = this.oStores.get(sName);
    if (!oStore) {
      throw new Error(
        `[nano-app] [ERROR] Store "${sName}" not found. Create src/stores/${sName}.store.ts.`,
      );
    }

    return oStore;
  }
}
