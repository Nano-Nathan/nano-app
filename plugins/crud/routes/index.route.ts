import { eq } from 'drizzle-orm';
import { createRoute, isGranted, NanoError } from '@nano-app/backend';
import Permissions from '../Permissions';
import Query from '../Query';
import type { ApiPromise, NanoObject, Params, Request } from '@nano-app/backend';

/** Permission of Better Auth that each method needs on the URL's table */
const ACTIONS: NanoObject<string> = {
  GET: 'read',
  QUERY: 'read',
  POST: 'create',
  PUT: 'update',
  DELETE: 'delete',
};

/** Conversion of the URL's id to the type of the table's `id` column, by its Drizzle data type */
const ID_TYPES: NanoObject<(sId: string) => number | bigint> = { number: Number, bigint: BigInt };

/** Reads a list, or one record, with the `QueryParams` of the body */
async function read(oReq: Request, { db, onBeforeResult }: Params): ApiPromise {
  return Query.read(db, onBeforeResult?.model, oReq.body ?? {}, onBeforeResult?.id);
}

/** The record a write returned: 404 when its id matched none */
function written(aRecords: NanoObject[]): { result: NanoObject } {
  if (!aRecords[0]) throw new NanoError('Not found', 404);
  return { result: aRecords[0] };
}

/** `GET` reads without parameters, `QUERY` with `QueryParams` as its body */
export default createRoute({
  expression: '/:model{/:id}',
  callbacks: {
    // The table of the URL: 404 when the app does not publish it, 403 without the permissions of the request
    onBefore: async (oReq, sMethod, oParams) => {
      // The URL's table and id: Express types a param as a string or a list of them
      const sModel = String(oReq.params.model);
      const { id } = oReq.params;

      // Only the tables the app publishes
      const oTable = oParams.schema?.[sModel];
      if (!oParams.models.includes(sModel) || !oTable) throw new NanoError('Not found', 404);

      // The permission of the method on the table, and `read` on every related table a read reaches
      const oNeeded = new Permissions(oParams.schema?.relations ?? {}).of(
        sModel,
        ACTIONS[sMethod],
        oReq.body ?? {},
      );
      if (!(await isGranted(oParams, oNeeded))) throw new NanoError('Forbidden', 403);

      // An update or a delete needs the id of its record
      const isOneRecord = sMethod === 'PUT' || sMethod === 'DELETE';
      if (isOneRecord && !id) throw new NanoError('Not found', 404);
      if (!id) return { model: sModel, table: oTable };

      // The id, converted to the type of the table's `id` column
      const sId = String(id);
      const sType = String(oTable.id.dataType).split(' ')[0];
      return { model: sModel, table: oTable, id: ID_TYPES[sType]?.(sId) ?? sId };
    },
  },
  GET: read,
  QUERY: read,
  POST: async (oReq, { db, onBeforeResult }) =>
    written(await db.insert(onBeforeResult?.table).values(oReq.body).returning()),
  PUT: async (oReq, { db, onBeforeResult }) => {
    const { table, id } = onBeforeResult ?? {};
    return written(await db.update(table).set(oReq.body).where(eq(table.id, id)).returning());
  },
  DELETE: async (_oReq, { db, onBeforeResult }) => {
    const { table, id } = onBeforeResult ?? {};
    return written(await db.delete(table).where(eq(table.id, id)).returning());
  },
});
