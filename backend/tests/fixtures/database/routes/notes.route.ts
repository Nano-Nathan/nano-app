import { createRoute } from "../../../../src";

/** /notes: reads and writes through the Prisma client the endpoint receives */
export default createRoute({
  GET: async (_req, db) => ({ success: true, result: await db.note.findMany({ orderBy: { id: "asc" } }) }),

  POST: async (req, db) => {
    if (!req.body?.title) throw { status: 400, message: "title is required" };
    return { success: true, result: await db.note.create({ data: { title: req.body.title } }) };
  },
});
