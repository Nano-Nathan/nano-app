import { eq } from 'drizzle-orm';
import { createRoute, NanoError } from '@nano-app/backend';
import { ACTIONS, DEFAULT_LIMIT } from '../const';
import type { ZodType } from 'zod';
import type { ApiPromise, HandlerParams, NanoObject, Request, RouteEntry } from '@nano-app/backend';

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

/** Inserts the body as a record */
async function create(_oReq: Request, { db, onBeforeResult }: HandlerParams): ApiPromise {
  const { table, body } = onBeforeResult;
  return first(await db.insert(table).values(body).returning());
}

/** Updates the record of the id with the body */
async function update(_oReq: Request, { db, onBeforeResult }: HandlerParams): ApiPromise {
  const { table, id, body } = onBeforeResult;
  return first(await db.update(table).set(body).where(eq(table.id, id)).returning());
}

/** Deletes the record of the id */
async function remove(_oReq: Request, { db, onBeforeResult }: HandlerParams): ApiPromise {
  const { table, id } = onBeforeResult;
  return first(await db.delete(table).where(eq(table.id, id)).returning());
}

/** The route of a table: `GET` and `QUERY` read, each method asks its permission on the table */
export default function route(
  sModel: string,
  oTable: unknown,
  oValidations: NanoObject<ZodType | undefined> = {},
): RouteEntry {
  // Each method with its handler and the permission of its action
  const oHandlers = { GET: read, QUERY: read, POST: create, PUT: update, DELETE: remove };
  const oMethods = Object.fromEntries(
    Object.entries(oHandlers).map(([sMethod, handler]) => [
      sMethod,
      { handler, permissions: { [sModel]: [ACTIONS[sMethod]] } },
    ]),
  );

  return createRoute({
    expression: '{/:id}',
    callbacks: {
      // The id and the validated body of the request
      onBefore: async (oReq, sMethod) => {
        const { id } = oReq.params;

        // The body as its validation gives it, or as it came
        const oBody = oReq.body ?? {};
        const oResult = oValidations[ACTIONS[sMethod]]?.safeParse(oBody) ?? {
          success: true as const,
          data: oBody,
        };
        if (!oResult.success) {
          const { path, message } = oResult.error.issues[0];
          throw new NanoError([...path, message].join(': '), 400);
        }

        // A read of an id answers its record; without it, the list
        const oRead = id ? { page: { where: { id }, limit: 1 }, answer: first } : { answer: list };
        return { model: sModel, table: oTable, id, body: oResult.data, ...oRead };
      },
    },
    ...oMethods,
  });
}
