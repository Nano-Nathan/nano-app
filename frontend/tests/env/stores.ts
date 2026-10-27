import { STORES_ENV } from '@nano-app/core/const';

// Stores of stores.test.ts, as `withNanoApp` inlines them: set before the frontend loads
process.env[STORES_ENV] = JSON.stringify({
  ui: { type: 'app', data: { busy: false } },
  backend: { type: 'api', data: { page: 1 } },
});
