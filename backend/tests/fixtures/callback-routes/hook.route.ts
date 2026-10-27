import { createRoute } from '../../../src/app/creators';

/** Route of a fixture plugin with every endpoint callback: records them in `options.calls` */
export default createRoute({
  callbacks: {
    onInit: async ({ calls }) => {
      calls.push('init');
    },
    onBefore: async (oReq, sMethod, { calls }) => {
      // Records the call
      calls.push(`before ${sMethod}`);

      // Rejects when asked to
      if (oReq.query.deny) throw { status: 403, message: 'denied' };

      // Passes a value to the handler
      return { greeting: 'hello' };
    },
  },

  GET: async (_oReq, { greeting, onBeforeResult }) => ({
    result: { greeting, before: onBeforeResult?.greeting },
  }),
});
