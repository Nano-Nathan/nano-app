import { STORES_DEFINE } from '@nano-app/core/const';

// Stores of message.test.tsx, as `withNanoApp` writes them: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({ app: { type: 'app' }, api: { type: 'api' }, admin: { type: 'api' } }),
  ),
});
