import { STORES_DEFINE } from '@nano-app/core/const';

// Stores of list.test.tsx, as `withNanoApp` writes them: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(Object.entries({ api: { type: 'api' }, admin: { type: 'api' } })),
});
