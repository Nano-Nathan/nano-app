import { STORES_ENV } from '@nano-app/core/const';

// Stores of controller.test.tsx, as `withNanoApp` inlines them: set before the frontend loads
process.env[STORES_ENV] = JSON.stringify({
  app: { type: 'app', data: { iCount: 0, sReason: '' } },
  ui: { type: 'app', data: { isOpen: false } },
});
