import { STORES_DEFINE } from '@nano-app/core/const';
import { BACKENDS_DEFINE } from '../../src/const';

// Stores of missing.test.ts: two api stores, neither with its URL
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({ admin_users: { type: 'api' }, orders: { type: 'api' } }),
  ),
  [BACKENDS_DEFINE]: JSON.stringify([
    ['admin_users', 'API_ADMIN_USERS_URL'],
    ['orders', 'API_ORDERS_URL'],
  ]),
});
delete process.env.API_ADMIN_USERS_URL;
delete process.env.API_ORDERS_URL;
