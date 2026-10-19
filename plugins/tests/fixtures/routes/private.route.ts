import { createRoute } from '@nano-app/backend';

export default createRoute({
  GET: async () => ({ success: true, result: 'private' }),
});
