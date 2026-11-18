// Stores of the tests, as `withNanoApp` writes them for an app
import type { ApiStore } from '@nano-app/frontend';

declare module '@nano-app/frontend' {
  interface Stores {
    api: ApiStore;
    admin: ApiStore;
  }
}
