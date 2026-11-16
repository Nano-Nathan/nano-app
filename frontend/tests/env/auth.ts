import { STORES_DEFINE } from '@nano-app/core/const';

// Stores of auth.test.ts, as `withNanoApp` writes them: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({
      app: { type: 'app' },
      backend: { type: 'api', auth: {} },
      payments: { type: 'api' },
    }),
  ),
});
