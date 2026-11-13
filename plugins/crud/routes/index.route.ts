import { eq } from 'drizzle-orm';
import { createRoute, isGranted, NanoError } from '@nano-app/backend';
import { ACTIONS, DEFAULT_LIMIT } from '../../const';
import type { ApiPromise, HandlerParams, NanoObject, Request } from '@nano-app/backend';

/** The first record of a query or a write: 404 without it */
function first(aRecords: NanoObject[]): { result: NanoObject } {
  if (!aRecords[0]) throw new NanoError('Not found', 404);
  return { result: aRecords[0] };
}

/** Every record of a query */
function list(aRecords: NanoObject[]): { result: NanoObject[] } {
  return { result: aRecords };
}

/** A list of the table, or one record by its id, with Drizzle's relational query of the body */
async function read(_oReq: Request, { db, onBeforeResult }: HandlerParams): ApiPromise {
  const { model, page, answer, body } = onBeforeResult;

  // Reads with the default limit, the body and the id over them
  return answer(await db.query[model].findMany({ limit: DEFAULT_LIMIT, ...body, ...page }));
}

/** `GET` reads without parameters, `QUERY` with `QueryParams` as its body */
export default createRoute({
  expression: '/:model{/:id}',
  callbacks: {
    // The table, the id and the validated body of the request
    onBefore: async (oReq, sMethod, oParams) => {
      // The table of the URL and the action of the method
      const sModel = String(oReq.params.model);
      const sAction = ACTIONS[sMethod];
      const { id } = oReq.params;

      // Only the tables the app publishes
      const oTable = oParams.dbSchema[sModel];
      if (!oParams.models.includes(sModel) || !oTable) throw new NanoError('Not found', 404);

      // The permission of the action on the table
      if (!(await isGranted(oParams.session, { [sModel]: [sAction] }))) {
        throw new NanoError('Forbidden', 403);
      }

      // The body as its validation gives it, or as it came
      const oBody = oReq.body ?? {};
      const oValidation = oParams.validations?.[sModel]?.[sAction];
      const oResult = oValidation?.safeParse(oBody) ?? { data: oBody };
      if (oResult.error) {
        const { path, message } = oResult.error.issues[0];
        throw new NanoError([...path, message].join(': '), 400);
      }

      // A read of an id answers its record; without it, the list
      const oRead = id ? { page: { where: { id }, limit: 1 }, answer: first } : { answer: list };
      return { model: sModel, table: oTable, id, body: oResult.data, ...oRead };
    },
  },
  GET: read,
  QUERY: read,
  POST: async (_oReq, { db, onBeforeResult }) => {
    const { table, body } = onBeforeResult;
    return first(await db.insert(table).values(body).returning());
  },
  PUT: async (_oReq, { db, onBeforeResult }) => {
    const { table, id, body } = onBeforeResult;
    return first(await db.update(table).set(body).where(eq(table.id, id)).returning());
  },
  DELETE: async (_oReq, { db, onBeforeResult }) => {
    const { table, id } = onBeforeResult;
    return first(await db.delete(table).where(eq(table.id, id)).returning());
  },
});
