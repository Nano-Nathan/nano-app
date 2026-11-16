import { STORES_DEFINE } from '@nano-app/core/const';

// Stores of stores.test.ts, as `withNanoApp` writes them: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({
      app: { type: 'app' },
      ui: { type: 'app', data: { busy: false } },
      backend: { type: 'api', data: { page: 1 } },
    }),
  ),
});
