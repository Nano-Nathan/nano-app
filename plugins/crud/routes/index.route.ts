import { createRoute, isGranted } from '@nano-app/backend';
import Query from '../Query';
import type { ApiPromise, NanoObject, Params, Request } from '@nano-app/backend';

/** Permission of Better Auth that each method needs on the URL's model */
const ACTIONS: NanoObject<string> = {
  GET: 'read',
  QUERY: 'read',
  POST: 'create',
  PUT: 'update',
  DELETE: 'delete',
};

/** Conversion of the URL's id to the type of the model's id, when it is not a string */
const ID_TYPES: NanoObject<(sId: string) => number | bigint> = { Int: Number, BigInt: BigInt };

/** The Prisma delegate of the URL's model: 404 when the app does not publish it, 403 without its permission */
// any: a delegate of the consumer's Prisma client
async function delegate(oReq: Request, oParams: Params): Promise<any> {
  // The URL's model: Express types a param as a string or a list of them
  const sModel = String(oReq.params.model);

  // Only the models the app publishes
  if (!oParams.models.includes(sModel)) throw { status: 404, message: 'Not found' };

  // The permission of the method on the model
  if (!(await isGranted(oParams, { [sModel]: [ACTIONS[oReq.method]] })))
    throw { status: 403, message: 'Forbidden' };

  // Its Prisma delegate
  return oParams.db[sModel];
}

/** The `where` of the URL's id, converted to the type of the model's id */
// any: a delegate of the consumer's Prisma client
function where(oReq: Request, oModel: any): NanoObject {
  // Converts the id when the model's id is a number
  const sId = String(oReq.params.id);
  return { id: ID_TYPES[oModel.fields.id.typeName]?.(sId) ?? sId };
}

/** A list of the model with its total, or one record by its id */
async function read(oReq: Request, oParams: Params): ApiPromise {
  const { id } = oReq.params;
  const oModel = await delegate(oReq, oParams);
  const oArgs = Query.toPrisma(oReq.body ?? {});

  // One record: only its fields and relations apply
  if (id) {
    const { select, include } = oArgs;
    return {
      result: await oModel.findUniqueOrThrow({ where: where(oReq, oModel), select, include }),
    };
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
  return { result: await (await delegate(oReq, oParams)).create({ data: oReq.body }) };
}

/** Updates only the fields of the body */
async function update(oReq: Request, oParams: Params): ApiPromise {
  const oModel = await delegate(oReq, oParams);
  return { result: await oModel.update({ where: where(oReq, oModel), data: oReq.body }) };
}

/** Deletes a record and answers it */
async function remove(oReq: Request, oParams: Params): ApiPromise {
  const oModel = await delegate(oReq, oParams);
  return { result: await oModel.delete({ where: where(oReq, oModel) }) };
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
