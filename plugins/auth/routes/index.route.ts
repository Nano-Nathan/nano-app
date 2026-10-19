import { createRoute } from '@nano-app/backend';
import { findKey, generateKey, hashKey, MASTER } from '../keys';
import type { Request } from '@nano-app/backend';

/** Columns the endpoints return: never the hash */
const SELECT = { id: true, name: true, isMaster: true, createdAt: true };

/** 404 of an id or an action that does not exist */
function notFound(oReq: Request): { status: number; message: string } {
  return { status: 404, message: `${oReq.path} not found` };
}

/**
 * API keys, managed only with the master key:
 *   GET    /                list them
 *   POST   /                create one { name }; the key is returned only now
 *   DELETE /:id             delete one (not the master)
 *   POST   /:id/renew       new key, same id ("master" renews the master)
 */
// any: the Prisma client is generated in the consumer's project, unknown to the plugin
export default createRoute<any>({
  expression: '{/:id}{/:action}',
  callbacks: {
    onBefore: async (oReq, _sMethod, { db }) => {
      // Only the master key manages the keys
      const oKey = await findKey(db, oReq.get('x-api-key'));
      if (!oKey?.isMaster)
        throw { status: 403, message: 'Only the master API key manages API keys' };
      return {};
    },
  },

  GET: async (oReq, { db }) => {
    // Lists the keys, without their hashes
    if (oReq.params.id) throw notFound(oReq);
    return { success: true, result: await db.apiKey.findMany({ select: SELECT }) };
  },

  POST: async (oReq, { db }) => {
    const { id, action } = oReq.params;

    // Renews a key: same id, a new key; the old one stops working now
    if (id && action === 'renew') {
      const oWhere = id === MASTER ? { isMaster: true } : { id };
      const oKey = await db.apiKey.findFirst({ where: oWhere });
      if (!oKey) throw notFound(oReq);

      const sKey = generateKey();
      await db.apiKey.update({ where: { id: oKey.id }, data: { hash: hashKey(sKey) } });
      return { success: true, result: { id: oKey.id, name: oKey.name, key: sKey } };
    }
    if (id) throw notFound(oReq);

    // Creates a key: returned only in this response
    const { name } = oReq.body ?? {};
    if (typeof name !== 'string' || !name.trim()) throw 'The API key needs a name';
    const sKey = generateKey();
    const oKey = await db.apiKey.create({ data: { name, hash: hashKey(sKey) }, select: SELECT });
    return { success: true, result: { ...oKey, key: sKey } };
  },

  DELETE: async (oReq, { db }) => {
    const { id, action } = oReq.params;
    if (!id || action) throw notFound(oReq);

    // Deletes a key, never the master
    const oKey = await db.apiKey.findUnique({ where: { id } });
    if (!oKey) throw notFound(oReq);
    if (oKey.isMaster) throw { status: 403, message: 'The master API key cannot be deleted' };

    await db.apiKey.delete({ where: { id } });
    return { success: true, result: { id } };
  },
});
