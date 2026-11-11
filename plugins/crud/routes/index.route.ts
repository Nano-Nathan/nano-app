import { eq } from 'drizzle-orm';
import { createRoute, isGranted, NanoError } from '@nano-app/backend';
import type { ApiPromise, NanoObject, Params, Request } from '@nano-app/backend';

/** Action of each method on the URL's table: the permission of Better Auth it needs and the validation of its body */
const ACTIONS: NanoObject<string> = {
  GET: 'read',
  QUERY: 'read',
  POST: 'create',
  PUT: 'update',
  DELETE: 'delete',
};

/** Records a list answers when the request sends no `limit` */
const DEFAULT_LIMIT = 100;

/** The first record of a query or a write: 404 without it */
function first(aRecords: NanoObject[]): { result: NanoObject } {
  if (!aRecords[0]) throw new NanoError('Not found', 404);
  return { result: aRecords[0] };
}

/** A list of the table, or one record by its id, with Drizzle's relational query of the body */
async function read(_oReq: Request, { db, onBeforeResult }: Params): ApiPromise {
  const { model, id, body } = onBeforeResult ?? {};

  // One record by its id
  if (id) return first(await db.query[model].findMany({ ...body, where: { id }, limit: 1 }));

  // The list, with the default limit when the body brings none
  const aRecords = await db.query[model].findMany({ ...body, limit: body.limit ?? DEFAULT_LIMIT });
  return { result: aRecords };
}

/** `GET` reads without parameters, `QUERY` with `QueryParams` as its body */
export default createRoute({
  expression: '/:model{/:id}',
  callbacks: {
    // The table of the URL and the body of the request: 404 when the app does not publish it, 403 without its permission, 400 when the body breaks its validation
    onBefore: async (oReq, sMethod, oParams) => {
      // The URL's table and the action of the method: Express types a param as a string or a list of them
      const sModel = String(oReq.params.model);
      const sAction = ACTIONS[sMethod];

      // Only the tables the app publishes, as its client knows them
      const oTable = oParams.db._.relations[sModel]?.table;
      if (!oParams.models.includes(sModel) || !oTable) throw new NanoError('Not found', 404);

      // The permission of the action on the table
      if (!(await isGranted(oParams, { [sModel]: [sAction] }))) {
        throw new NanoError('Forbidden', 403);
      }

      // The body as the validation of the action gives it, answering the first rule it breaks with its field
      const oBody = oReq.body ?? {};
      const oResult = oParams.validations?.[sModel]?.[sAction]?.safeParse(oBody);
      if (oResult?.error) {
        const { path, message } = oResult.error.issues[0];
        throw new NanoError([...path, message].join(': '), 400);
      }

      // The id of the URL, if any: Postgres casts it to the type of the column
      return { model: sModel, table: oTable, id: oReq.params.id, body: oResult?.data ?? oBody };
    },
  },
  GET: read,
  QUERY: read,
  POST: async (_oReq, { db, onBeforeResult }) => {
    const { table, body } = onBeforeResult ?? {};
    return first(await db.insert(table).values(body).returning());
  },
  PUT: async (_oReq, { db, onBeforeResult }) => {
    const { table, id, body } = onBeforeResult ?? {};
    return first(await db.update(table).set(body).where(eq(table.id, id)).returning());
  },
  DELETE: async (_oReq, { db, onBeforeResult }) => {
    const { table, id } = onBeforeResult ?? {};
    return first(await db.delete(table).where(eq(table.id, id)).returning());
  },
});
