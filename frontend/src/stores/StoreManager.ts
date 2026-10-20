import { proxy } from 'valtio/vanilla';
import Store from './Store';
import { DEFAULT_APP_STORE } from '../const';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { StoreFiles } from '../types/store';

/** The stores of one React tree, over a single reactive state */
export default class StoreManager {
  /** State of every store, by store name */
  public readonly oRoot = proxy<NanoObject>({});
  private oStores = new Map<string, Store>();
  private oFiles: StoreFiles;

  /** Creates a store per file, plus an empty `app` store when the app has none */
  constructor(oFiles: StoreFiles) {
    // Adds the default app store
    this.oFiles = { [DEFAULT_APP_STORE]: { type: 'app' }, ...oFiles };

    // Creates each store over its branch of the shared state
    for (const [sName, oFile] of Object.entries(this.oFiles)) {
      this.oRoot[sName] = oFile.data ?? {};
      this.oStores.set(sName, new Store(sName, this.oRoot[sName]));
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
