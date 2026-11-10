import { defineRelations, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createRoute, isGranted, NanoError } from '@nano-app/backend';
import type { ApiPromise, NanoObject, Params, Request } from '@nano-app/backend';
import type { ZodType } from 'zod';

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

/** Clients that know the tables but none of their relations, one per client of an app */
// any: the client and the tables of each app, unknown to the plugin
const TABLE_ONLY = new WeakMap<NanoObject, any>();

/** A body as its schema gives it, or as it came without one: 400 with what zod says when it breaks a rule */
// any: the body is the consumer's, unknown to the plugin
function parse(oSchema: ZodType | undefined, oBody: unknown): any {
  // Without a schema of the app, the body goes as it came
  if (!oSchema) return oBody;

  // Answers the first rule it breaks, with its field
  const oResult = oSchema.safeParse(oBody);
  if (oResult.success) return oResult.data;
  const { path, message } = oResult.error.issues[0];
  throw new NanoError([...path, message].join(': '), 400);
}

/** A list of the table, or one record by its id, with Drizzle's relational query of the body on the table alone */
async function read(oReq: Request, { db, schema, onBeforeResult }: Params): ApiPromise {
  const { model, id, schemas } = onBeforeResult ?? {};
  const oBody: NanoObject = parse(schemas.query, oReq.body ?? {});

  // A client on the same pool that knows the tables but none of their relations: a query cannot leave its table
  if (!TABLE_ONLY.has(db)) {
    const { relations: _oRelations, ...oTables } = schema;
    // any: the tables of each app, unknown to the plugin
    const oNoRelations: any = defineRelations(oTables);
    TABLE_ONLY.set(db, drizzle({ client: db.$client, relations: oNoRelations }));
  }

  // One record by its id, or the list: the body goes as it came, so Drizzle rejects what leaves the table
  const oQuery = TABLE_ONLY.get(db).query[model];
  if (id) return first(await oQuery.findMany({ ...oBody, where: { id }, limit: 1 }));
  return {
    result: await oQuery.findMany({
      ...oBody,
      where: oBody.where ?? {},
      limit: oBody.limit ?? DEFAULT_LIMIT,
    }),
  };
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

      // The table, the id of the URL, if any (Postgres casts it to the type of the column), and the app's schemas
      return { model: sModel, table: oTable, id, schemas: oParams.schemas?.[sModel] ?? {} };
    },
  },
  GET: read,
  QUERY: read,
  POST: async (oReq, { db, onBeforeResult }) => {
    const { table, schemas } = onBeforeResult ?? {};
    return first(await db.insert(table).values(parse(schemas.insert, oReq.body)).returning());
  },
  PUT: async (oReq, { db, onBeforeResult }) => {
    const { table, id, schemas } = onBeforeResult ?? {};
    const oData = parse(schemas.update, oReq.body);
    return first(await db.update(table).set(oData).where(eq(table.id, id)).returning());
  },
  DELETE: async (_oReq, { db, onBeforeResult }) => {
    const { table, id } = onBeforeResult ?? {};
    return first(await db.delete(table).where(eq(table.id, id)).returning());
  },
});
