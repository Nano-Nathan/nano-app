import { createRoute, isGranted, NanoError } from '@nano-app/backend';
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

/** Reads a list, or one record, with the `QueryParams` of the body */
async function read(oReq: Request, { onBeforeResult }: Params): ApiPromise {
  return Query.read(onBeforeResult?.model, oReq.body ?? {}, onBeforeResult?.where);
}

/** `GET` reads without parameters, `QUERY` with `QueryParams` as its body */
export default createRoute({
  expression: '/:model{/:id}',
  callbacks: {
    // The Prisma delegate of the URL's model: 404 when the app does not publish it, 403 without its permission
    onBefore: async (oReq, sMethod, oParams) => {
      // The URL's model and id: Express types a param as a string or a list of them
      const sModel = String(oReq.params.model);
      const { id } = oReq.params;

      // Only the models the app publishes
      if (!oParams.models.includes(sModel)) throw new NanoError('Not found', 404);

      // The permission of the method on the model
      if (!(await isGranted(oParams, { [sModel]: [ACTIONS[sMethod]] })))
        throw new NanoError('Forbidden', 403);

      // Its Prisma delegate
      const oModel = oParams.db[sModel];
      if (!id) return { model: oModel };

      // With an id, its `where`, converted to the type of the model's id
      const sId = String(id);
      return { model: oModel, where: { id: ID_TYPES[oModel.fields.id.typeName]?.(sId) ?? sId } };
    },
  },
  // A list of the model with its total, or one record by its id
  GET: read,
  QUERY: read,
  // Creates a record with the body as its data
  POST: async (oReq, { onBeforeResult }) => ({
    result: await onBeforeResult?.model.create({ data: oReq.body }),
  }),
  // Updates only the fields of the body
  PUT: async (oReq, { onBeforeResult }) => ({
    result: await onBeforeResult?.model.update({ where: onBeforeResult.where, data: oReq.body }),
  }),
  // Deletes a record and answers it
  DELETE: async (_oReq, { onBeforeResult }) => ({
    result: await onBeforeResult?.model.delete({ where: onBeforeResult.where }),
  }),
});
