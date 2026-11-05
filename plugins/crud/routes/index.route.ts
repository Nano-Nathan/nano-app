import { createRoute } from '@nano-app/backend';
import Query from '../Query';
import type { ApiPromise, Params, QueryParams, Request } from '@nano-app/backend';

/** A list of the model with its total, or one record by its id as the URL sends it */
async function read(oReq: Request, { db }: Params): ApiPromise {
  const { id } = oReq.params;
  // Express types a param as a string or a list of them: the model is always one string
  const sModel = String(oReq.params.model);
  const oQuery: QueryParams = oReq.body ?? {};
  const oArgs = Query.toPrisma(oQuery);

  // One record: only its fields and relations apply
  if (id) {
    const { select, include } = oArgs;
    const oRecord = await db[sModel].findUnique({ where: { id }, select, include });
    if (!oRecord) throw { status: 404, message: `${oReq.path} not found` };
    return { result: oRecord };
  }

  // A list: the page and the total of the same filter
  const [aRecords, iCount] = await Promise.all([
    db[sModel].findMany(oArgs),
    db[sModel].count({ where: oArgs.where }),
  ]);
  return { result: aRecords, count: iCount };
}

/** Creates a record with the body as its data */
async function create(oReq: Request, { db }: Params): ApiPromise {
  return { result: await db[String(oReq.params.model)].create({ data: oReq.body }) };
}

/** Updates only the fields of the body */
async function update(oReq: Request, { db }: Params): ApiPromise {
  const { id } = oReq.params;
  return { result: await db[String(oReq.params.model)].update({ where: { id }, data: oReq.body }) };
}

/** Deletes a record and answers it */
async function remove(oReq: Request, { db }: Params): ApiPromise {
  const { id } = oReq.params;
  return { result: await db[String(oReq.params.model)].delete({ where: { id } }) };
}

/** `GET` reads without parameters, `QUERY` with `QueryParams` as its body */
export default createRoute({
  expression: '/:model{/:id}',
  GET: read,
  QUERY: read,
  POST: create,
  PUT: update,
  DELETE: remove,
});
