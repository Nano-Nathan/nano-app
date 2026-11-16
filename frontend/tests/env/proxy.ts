import { STORES_DEFINE } from '@nano-app/core/const';
import { BACKENDS_DEFINE } from '../../src/const';

// Stores of proxy.test.ts, as `withNanoApp` writes them: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({
      admin_users: { type: 'api', headers: { 'x-api-key': 'users_key' } },
      orders: { type: 'api', headers: { 'x-api-key': 'ORDERS_KEY' } },
      guarded: {
        type: 'api',
        auth: {
          path: '/auth',
          routes: [
            { match: '/dashboard', redirect: '/login' },
            { match: '/admin/*', roles: 'admin,editor' },
            { match: '/reports', permissions: { collections: 'read,update' } },
          ],
        },
      },
    }),
  ),
  [BACKENDS_DEFINE]: JSON.stringify([
    ['admin_users', 'API_ADMIN_USERS_URL'],
    ['orders', 'API_ORDERS_URL'],
    ['guarded', 'API_GUARDED_URL'],
  ]),
});
