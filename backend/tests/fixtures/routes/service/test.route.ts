import { createRoute } from '../../../../src/app/creators';

/** Route to /service/test/:id */
export default createRoute({
  expression: '/:id',
  GET: async oReq => ({ success: true, result: { id: oReq.params.id } }),
  DELETE: async () => ({ success: false, message: 'no se puede borrar' }),
  QUERY: async oReq => ({ success: true, result: { id: oReq.params.id, query: oReq.body } }),
});
