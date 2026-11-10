import { NanoError } from '@nano-app/backend';
import type { ApiPromise, NanoObject, QueryParams } from '@nano-app/backend';

/** Records a list answers when the request sends no `top` */
const DEFAULT_TOP = 100;

/** Reads a table of the app's Drizzle client with core's `QueryParams` */
export default abstract class Query {
  /** A list of the table, or one record by its id: 404 without it */
  // any: the client is typed by the schema of each app, unknown to the plugin
  public static async read(
    oDb: any,
    sModel: string,
    oQuery: QueryParams,
    oId?: unknown,
  ): ApiPromise {
    // A list: the relational query of the parameters
    const oArgs = Query.toDrizzle(oQuery);
    if (oId === undefined) return { result: await oDb.query[sModel].findMany(oArgs) };

    // One record by its id, with the columns and relations asked
    const oRecord = await oDb.query[sModel].findFirst({
      where: { id: oId },
      columns: oArgs.columns,
      with: oArgs.with,
    });
    if (!oRecord) throw new NanoError('Not found', 404);
    return { result: oRecord };
  }

  /** `filter` → `where`, `orderby` → `orderBy`, `top`/`skip` → `limit`/`offset`, `select` → `columns`, `expand` → `with` */
  public static toDrizzle(oQuery: QueryParams): NanoObject {
    const { filter, orderby, top, skip, select, expand } = oQuery;

    // Orders only by the table's own columns
    if (Object.keys(orderby ?? {}).some(sKey => sKey.includes('.'))) {
      throw new NanoError('"orderby" takes columns of the model, not of its relations.', 400);
    }

    return {
      where: filter,
      orderBy: orderby,
      limit: top ?? DEFAULT_TOP,
      offset: skip,
      columns: select && Object.fromEntries(Query.list(select).map(sField => [sField, true])),
      with: expand && Query.with(Query.list(expand)),
    };
  }

  /** `['user', 'posts.comments']` → `{ user: true, posts: { with: { comments: true } } }` */
  private static with(aPaths: string[]): NanoObject {
    // The first level of each path, once
    const aRelations = [...new Set(aPaths.map(sPath => sPath.split('.')[0]))];

    // Each relation, with the rest of its paths nested
    return Object.fromEntries(
      aRelations.map(sRelation => {
        const aNested = aPaths
          .filter(sPath => sPath.startsWith(`${sRelation}.`))
          .map(sPath => sPath.slice(sRelation.length + 1));
        return [sRelation, aNested.length ? { with: Query.with(aNested) } : true];
      }),
    );
  }

  /** `"a, b"` → `['a', 'b']` */
  private static list(sList: string): string[] {
    return sList.split(',').map(sItem => sItem.trim());
  }
}
