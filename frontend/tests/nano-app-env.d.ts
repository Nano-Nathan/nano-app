// Stores of the tests, as `withNanoApp` writes them for an app
import type ApiStore from '../src/stores/ApiStore';
import type Store from '../src/stores/Store';

declare module '../src/types/store' {
  interface Stores {
    app: Store;
    ui: Store;
    backend: ApiStore;
    payments: ApiStore;
  }
}
