import { STORES_ENV } from '@nano-app/core/const';

// Stores of proxy.test.ts, as `withNanoApp` inlines them: set before the frontend loads
process.env[STORES_ENV] = JSON.stringify({
  admin_users: { type: 'api', headers: { 'x-api-key': 'users_key' } },
  orders: { type: 'api', headers: { 'x-api-key': 'ORDERS_KEY' } },
});
