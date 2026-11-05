import { createRoute } from '@nano-app/backend';
import Query from '../Query';
import type { ApiPromise, Params, Request } from '@nano-app/backend';

/** The Prisma delegate of the URL's model: Express types a param as a string or a list of them */
function delegate(oReq: Request, { db }: Params) {
  return db[String(oReq.params.model)];
}

/** A list of the model with its total, or one record by its id as the URL sends it */
async function read(oReq: Request, oParams: Params): ApiPromise {
  const { id } = oReq.params;
  const oModel = delegate(oReq, oParams);
  const oArgs = Query.toPrisma(oReq.body ?? {});

  // One record: only its fields and relations apply
  if (id) {
    const { select, include } = oArgs;
    return { result: await oModel.findUniqueOrThrow({ where: { id }, select, include }) };
  }

  // A list: the page and the total of the same filter
  const [aRecords, iCount] = await Promise.all([
    oModel.findMany(oArgs),
    oModel.count({ where: oArgs.where }),
  ]);
  return { result: aRecords, count: iCount };
}

/** Creates a record with the body as its data */
async function create(oReq: Request, oParams: Params): ApiPromise {
  return { result: await delegate(oReq, oParams).create({ data: oReq.body }) };
}

/** Updates only the fields of the body */
async function update(oReq: Request, oParams: Params): ApiPromise {
  const { id } = oReq.params;
  return { result: await delegate(oReq, oParams).update({ where: { id }, data: oReq.body }) };
}

/** Deletes a record and answers it */
async function remove(oReq: Request, oParams: Params): ApiPromise {
  const { id } = oReq.params;
  return { result: await delegate(oReq, oParams).delete({ where: { id } }) };
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
