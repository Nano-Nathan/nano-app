import { STORES_DEFINE } from '@nano-app/core/const';

// Stores of controller.test.tsx, as `withNanoApp` writes them: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({
      app: { type: 'app', data: { iCount: 0, sReason: '' } },
      ui: { type: 'app', data: { isOpen: false } },
    }),
  ),
});
