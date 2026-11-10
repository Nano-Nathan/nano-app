import { NanoError } from '@nano-app/backend';
import type { ApiPromise, NanoObject, QueryParams } from '@nano-app/backend';

/** Records a list answers when the request sends no `limit` */
const DEFAULT_LIMIT = 100;

/** Reads a table of the app's Drizzle client with core's `QueryParams`, Drizzle's own relational query */
export default abstract class Query {
  /** A list of the table, or one record by its id: 404 without it */
  // any: the client is typed by the schema of each app, unknown to the plugin
  public static async read(
    oDb: any,
    sModel: string,
    oQuery: QueryParams,
    oId?: unknown,
  ): ApiPromise {
    const { where = {}, with: oWith, columns, orderBy, limit = DEFAULT_LIMIT, offset } = oQuery;

    // A list: the relational query as it came
    if (oId === undefined) {
      const oArgs = { where, with: oWith, columns, orderBy, limit, offset };
      return { result: await oDb.query[sModel].findMany(oArgs) };
    }

    // One record by its id, with the columns and relations asked
    const oRecord = await oDb.query[sModel].findFirst({ where: { id: oId }, with: oWith, columns });
    if (!oRecord) throw new NanoError('Not found', 404);
    return { result: oRecord };
  }

  /** Tables of the relations a `where` or a `with` names, at any depth */
  public static related(oRelations: NanoObject, sTable: string, oValue: unknown): string[] {
    // Walks arrays and objects; anything else names no relation
    if (Array.isArray(oValue))
      return oValue.flatMap(oItem => Query.related(oRelations, sTable, oItem));
    if (!oValue || typeof oValue !== 'object') return [];

    // A key that is a relation adds its table and goes on inside it; any other key, inside the same table
    return Object.entries(oValue).flatMap(([sKey, oItem]) => {
      const sTarget = oRelations[sTable]?.relations[sKey]?.targetTableName;
      const aInside = Query.related(oRelations, sTarget ?? sTable, oItem);
      return sTarget ? [sTarget, ...aInside] : aInside;
    });
  }
}
