export default {
  type: 'api',
  headers: { 'x-api-key': 'BACKEND_KEY' },
  auth: { path: '/api/auth', routes: [{ match: '/private/*', redirect: '/login' }] },
};
