import { STORES_ENV } from '@nano-app/core/const';

// Stores of auth.test.tsx, as `withNanoApp` inlines them: set before the frontend loads
process.env[STORES_ENV] = JSON.stringify({
  api: { type: 'api', auth: '/api/auth' },
  admin: { type: 'api', auth: '/auth' },
});
