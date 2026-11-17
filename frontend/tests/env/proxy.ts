import { STORES_DEFINE } from '@nano-app/core/const';
import { BACKENDS_DEFINE } from '../../src/const';

// Stores of proxy.test.ts and their backend URLs: set before the proxy loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({ admin_users: { type: 'api' }, orders: { type: 'api' } }),
  ),
  [BACKENDS_DEFINE]: JSON.stringify([
    ['admin_users', 'API_ADMIN_USERS_URL'],
    ['orders', 'API_ORDERS_URL'],
  ]),
});
process.env.API_ADMIN_USERS_URL = 'http://localhost:4100/api';
process.env.API_ORDERS_URL = 'http://localhost:4100';
