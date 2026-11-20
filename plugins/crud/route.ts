import { eq } from 'drizzle-orm';
import { createRoute, NanoError } from '@nano-app/backend';
import { ACTIONS, DEFAULT_LIMIT } from '../const';
import { SCHEMAS } from './const';
import type { ZodType } from 'zod';
import type { ApiPromise, HandlerParams, NanoObject, Request, RouteEntry } from '@nano-app/backend';

/** The first record of a query or a write: 404 without it */
function first(aRecords: NanoObject[]): { result: NanoObject } {
  if (!aRecords[0]) throw new NanoError('nano.error.notFound', 404);
  return { result: aRecords[0] };
}

/** The route of a model: `GET` and `QUERY` read, each method asks its permission on its table */
export default function route(
  sModel: string,
  oValidations: NanoObject<ZodType | undefined> = {},
): RouteEntry {
  // A list of the model with its count, or the record of the id, with Drizzle's relational query
  const fnRead = async (oReq: Request, { db, onBeforeResult }: HandlerParams): ApiPromise => {
    const { id } = oReq.params;

    // An id reads its record; without it, the list and how many records it brings
    const oRead = id
      ? { page: { where: { id }, limit: 1 }, answer: first }
      : {
          page: {},
          answer: (values: NanoObject[]) => ({ result: { values, count: values.length } }),
        };
    const oQuery = { limit: DEFAULT_LIMIT, ...onBeforeResult.body, ...oRead.page };
    return oRead.answer(await db.query[sModel].findMany(oQuery));
  };

  return createRoute({
    expression: '{/:id}',
    callbacks: {
      // Fails at startup when the app's relations have no such model
      onInit: async ({ relations }) => {
        if (relations?.[sModel]) return;
        throw new NanoError(
          `crud: the model "${sModel}" is not in the relations of the app's database. Add its table to \`defineRelations\`.`,
        );
      },

      // The table and the body as the app's validation or the table's schema gives it
      onBefore: async (oReq, sMethod, { relations }) => {
        const { table } = relations[sModel];
        const sAction = ACTIONS[sMethod];
        const oSchema = oValidations[sAction] ?? SCHEMAS[sAction]?.(table);

        // Without a schema, the body as it came
        const oBody = oReq.body ?? {};
        const oResult = oSchema?.safeParse(oBody) ?? { success: true as const, data: oBody };
        if (!oResult.success) {
          const { path, message } = oResult.error.issues[0];
          throw new NanoError([...path, message].join(': '), 400);
        }
        return { table, body: oResult.data };
      },
    },
    GET: { handler: fnRead, permissions: { [sModel]: ['read'] } },
    QUERY: { handler: fnRead, permissions: { [sModel]: ['read'] } },
    POST: {
      handler: async (_oReq, { db, onBeforeResult: { table, body } }) =>
        first(await db.insert(table).values(body).returning()),
      permissions: { [sModel]: ['create'] },
    },
    PUT: {
      handler: async (oReq, { db, onBeforeResult: { table, body } }) =>
        first(await db.update(table).set(body).where(eq(table.id, oReq.params.id)).returning()),
      permissions: { [sModel]: ['update'] },
    },
    DELETE: {
      handler: async (oReq, { db, onBeforeResult: { table } }) =>
        first(await db.delete(table).where(eq(table.id, oReq.params.id)).returning()),
      permissions: { [sModel]: ['delete'] },
    },
  });
}
