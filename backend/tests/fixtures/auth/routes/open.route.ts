import { createRoute } from '../../../../src/lib/creators';

/** /open: public, with the user of the session when there is one */
export default createRoute({
  public: true,
  GET: async (_oReq, { session }) => ({ result: session?.user.email ?? null }),
});
