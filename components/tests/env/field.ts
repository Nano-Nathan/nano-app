import { STORES_DEFINE } from '@nano-app/core/const';

// Stores of field.test.tsx, as `withNanoApp` writes them: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(Object.entries({ app: { type: 'app' }, api: { type: 'api' } })),
});
