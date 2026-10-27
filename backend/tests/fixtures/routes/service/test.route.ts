import { createRoute } from '../../../../src/app/creators';

/** Route to /service/test/:id */
export default createRoute({
  expression: '/:id',
  GET: async oReq => ({ result: { id: oReq.params.id } }),
  DELETE: async () => ({ status: 409, message: 'Cannot be deleted' }),
  QUERY: async oReq => ({ result: { id: oReq.params.id, query: oReq.body } }),
});
