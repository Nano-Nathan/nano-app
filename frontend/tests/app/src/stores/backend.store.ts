export default {
  type: 'api',
  headers: { 'x-api-key': 'BACKEND_KEY' },
  auth: { routes: [{ match: '/private/*', redirect: '/login' }] },
};
