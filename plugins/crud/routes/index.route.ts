import { defineRelations, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createRoute, isGranted, NanoError } from '@nano-app/backend';
import type { ApiPromise, NanoObject, Params, QueryParams, Request } from '@nano-app/backend';

/** Permission of Better Auth that each method needs on the URL's table */
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

/** A list of the table, or one record by its id, with Drizzle's relational query of the body on the table alone */
async function read(oReq: Request, { db, schema, onBeforeResult }: Params): ApiPromise {
  const { model, id } = onBeforeResult ?? {};
  const {
    where = {},
    columns,
    orderBy,
    limit = DEFAULT_LIMIT,
    offset,
  }: QueryParams = oReq.body ?? {};

  // A client on the same pool that knows the tables but none of their relations: a query cannot leave its table
  const { relations: _oRelations, ...oTables } = schema;
  // any: the tables of each app, unknown to the plugin
  const oNoRelations: any = defineRelations(oTables);
  const oTableOnly = drizzle({ client: db.$client, relations: oNoRelations });

  // One record by its id, or the list
  const oQuery = oTableOnly.query[model];
  if (id) return first(await oQuery.findMany({ where: { id }, columns, limit: 1 }));
  return { result: await oQuery.findMany({ where, columns, orderBy, limit, offset }) };
}

/** `GET` reads without parameters, `QUERY` with `QueryParams` as its body */
export default createRoute({
  expression: '/:model{/:id}',
  callbacks: {
    // The table of the URL: 404 when the app does not publish it, 403 without its permission
    onBefore: async (oReq, sMethod, oParams) => {
      // The URL's table and id: Express types a param as a string or a list of them
      const sModel = String(oReq.params.model);
      const { id } = oReq.params;

      // Only the tables the app publishes
      const oTable = oParams.schema?.[sModel];
      if (!oParams.models.includes(sModel) || !oTable) throw new NanoError('Not found', 404);

      // The permission of the method on the table
      if (!(await isGranted(oParams, { [sModel]: [ACTIONS[sMethod]] }))) {
        throw new NanoError('Forbidden', 403);
      }

      // The table and the id of the URL, if any: Postgres casts it to the type of the column
      return { model: sModel, table: oTable, id };
    },
  },
  GET: read,
  QUERY: read,
  POST: async (oReq, { db, onBeforeResult }) =>
    first(await db.insert(onBeforeResult?.table).values(oReq.body).returning()),
  PUT: async (oReq, { db, onBeforeResult }) => {
    const { table, id } = onBeforeResult ?? {};
    return first(await db.update(table).set(oReq.body).where(eq(table.id, id)).returning());
  },
  DELETE: async (_oReq, { db, onBeforeResult }) => {
    const { table, id } = onBeforeResult ?? {};
    return first(await db.delete(table).where(eq(table.id, id)).returning());
  },
});
