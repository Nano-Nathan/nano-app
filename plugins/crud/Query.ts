import type { ApiPromise, NanoObject, QueryParams } from '@nano-app/backend';

/** Records a list answers when the request sends no `top` */
const DEFAULT_TOP = 100;

/** Reads a model of the app's Prisma client with core's `QueryParams` */
export default abstract class Query {
  /** A list of the model with its total, or one record by its `where` */
  // any: a delegate of the consumer's Prisma client
  public static async read(oModel: any, oQuery: QueryParams, oWhere?: NanoObject): ApiPromise {
    // The Prisma arguments of the query
    const oArgs = Query.toPrisma(oQuery);

    // One record: only its fields and relations apply
    if (oWhere) {
      const { select, include } = oArgs;
      return { result: await oModel.findUniqueOrThrow({ where: oWhere, select, include }) };
    }

    // A list: the page and the total of the same filter
    const [aRecords, iCount] = await Promise.all([
      oModel.findMany(oArgs),
      oModel.count({ where: oArgs.where }),
    ]);
    return { result: aRecords, count: iCount };
  }

  /** `filter` → `where`, `orderby` → `orderBy`, `top`/`skip` → `take`/`skip`, `select` and `expand` → `select` or `include` */
  public static toPrisma(oQuery: QueryParams): NanoObject {
    const { filter, orderby, top, skip, select, expand } = oQuery;

    // Prisma does not take select and include on the same level: with select, the relations go inside it
    const oInclude = expand ? Query.include(Query.list(expand)) : undefined;
    const oSelect = select ? Query.fields(Query.list(select), oInclude) : undefined;

    // Prisma leaves out the arguments that are undefined
    return {
      where: filter,
      orderBy:
        orderby &&
        Object.entries(orderby).map(([sPath, sDirection]) =>
          Query.nest(sPath.split('.'), sDirection),
        ),
      take: top ?? DEFAULT_TOP,
      skip,
      select: oSelect,
      include: oSelect ? undefined : oInclude,
    };
  }

  /** `['user', 'name']`, `'asc'` → `{ user: { name: 'asc' } }` */
  private static nest(aPath: string[], sValue: string): NanoObject {
    const [sField, ...aRest] = aPath;
    return { [sField]: aRest.length ? Query.nest(aRest, sValue) : sValue };
  }

  /** `['user', 'posts.comments']` → `{ user: true, posts: { include: { comments: true } } }` */
  private static include(aPaths: string[]): NanoObject {
    const aRelations = [...new Set(aPaths.map(sPath => sPath.split('.')[0]))];

    return Object.fromEntries(
      aRelations.map(sRelation => {
        // The paths under this relation, without it
        const aNested = aPaths
          .filter(sPath => sPath.startsWith(`${sRelation}.`))
          .map(sPath => sPath.slice(sRelation.length + 1));

        return [sRelation, aNested.length ? { include: Query.include(aNested) } : true];
      }),
    );
  }

  /** `['id', 'name']` → `{ id: true, name: true }`, plus the relations to load */
  private static fields(aFields: string[], oInclude?: NanoObject): NanoObject {
    return { ...Object.fromEntries(aFields.map(sField => [sField, true])), ...oInclude };
  }

  /** `"a, b"` → `['a', 'b']` */
  private static list(sList: string): string[] {
    return sList.split(',').map(sItem => sItem.trim());
  }
}
