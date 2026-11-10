import { createRoute } from '../../../../src';
import { notes } from '../schema';

/** /notes: reads and writes through the Drizzle client the endpoint receives (untyped: a fixture client) */
export default createRoute<any>({
  GET: async (_oReq, { db }) => ({
    result: await db.query.notes.findMany({ orderBy: { id: 'asc' } }),
  }),

  POST: async (oReq, { db }) => {
    if (!oReq.body?.title) throw { status: 400, message: 'title is required' };

    const [oNote] = await db.insert(notes).values({ title: oReq.body.title }).returning();
    return { result: oNote };
  },
});
