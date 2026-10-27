import { createRoute } from '../../../../src';

/** /has-db: whether the handler received a Prisma client */
export default createRoute({
  GET: async (_oReq, { db }) => ({ result: db !== undefined }),
});
