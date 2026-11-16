export default {
  type: 'api',
  auth: { routes: [{ match: '/private/*', redirect: '/login' }] },
};
