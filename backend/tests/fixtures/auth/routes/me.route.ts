import { createRoute } from '../../../../src/app/creators';

/** /me: the user of the session the handler receives */
export default createRoute({
  GET: async (_oReq, { session }) => ({ result: session?.user.email }),
});
