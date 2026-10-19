import { createRoute } from '../../../../src';

/** /notes: reads and writes through the Prisma client the endpoint receives (untyped: a fixture client) */
export default createRoute<any>({
  GET: async (_oReq, { db }) => ({
    success: true,
    result: await db.note.findMany({ orderBy: { id: 'asc' } }),
  }),

  POST: async (oReq, { db }) => {
    // Checks that the title is set
    if (!oReq.body?.title) throw { status: 400, message: 'title is required' };

    // Creates the note
    return { success: true, result: await db.note.create({ data: { title: oReq.body.title } }) };
  },
});
