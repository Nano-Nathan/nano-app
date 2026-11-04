import type { NanoObject, QueryParams } from '@nano-app/backend';

/** Records a list answers when the request sends no `top` */
const DEFAULT_TOP = 100;

/** Arguments of a Prisma `findMany` */
export type PrismaArgs = {
  where?: NanoObject;
  orderBy?: NanoObject[];
  take: number;
  skip?: number;
  select?: NanoObject;
  include?: NanoObject;
};

/** Translates core's `QueryParams` into the arguments of Prisma */
export default abstract class Query {
  /** `filter` → `where`, `orderby` → `orderBy`, `top`/`skip` → `take`/`skip`, `select` → `select`, `expand` → `include` */
  public static toPrisma(oQuery: QueryParams = {}): PrismaArgs {
    const { filter, orderby, top, skip, select, expand } = oQuery;

    // 100 by default; the client may ask for any amount
    const oArgs: PrismaArgs = { take: top ?? DEFAULT_TOP };

    // Prisma's operators as they are
    if (filter) oArgs.where = filter;

    // The fields in the order they were sent
    if (orderby) oArgs.orderBy = Query.orderBy(orderby);

    // Records to leave out, as they are
    if (skip !== undefined) oArgs.skip = skip;

    // Prisma does not take select and include on the same level: the relations go inside select
    const oInclude = expand ? Query.include(expand) : undefined;
    if (select) oArgs.select = { ...Query.select(select), ...oInclude };
    else if (oInclude) oArgs.include = oInclude;

    return oArgs;
  }

  /** `{ "user.name": "asc" }` → `[{ user: { name: 'asc' } }]`, one entry per field */
  private static orderBy(oOrderBy: NanoObject<'asc' | 'desc'>): NanoObject[] {
    return Object.entries(oOrderBy).map(
      // Nests one object per segment of the dot notation, from the last one
      ([sPath, sDirection]) =>
        sPath
          .split('.')
          .reduceRight<unknown>(
            (oValue, sField) => ({ [sField]: oValue }),
            sDirection,
          ) as NanoObject,
    );
  }

  /** `"id,name"` → `{ id: true, name: true }` */
  private static select(sSelect: string): NanoObject<true> {
    return Object.fromEntries(Query.list(sSelect).map(sField => [sField, true]));
  }

  /** `"user,posts.comments"` → `{ user: true, posts: { include: { comments: true } } }`, with no depth ceiling */
  private static include(sExpand: string): NanoObject {
    const oInclude: NanoObject = {};

    for (const sPath of Query.list(sExpand)) {
      const aRelations = sPath.split('.');
      let oLevel = oInclude;

      aRelations.forEach((sRelation, iIndex) => {
        // The last relation of the path is only loaded, unless another path already goes deeper
        if (iIndex === aRelations.length - 1) {
          oLevel[sRelation] ??= true;
          return;
        }

        // The others include the next level
        if (typeof oLevel[sRelation] !== 'object') oLevel[sRelation] = { include: {} };
        oLevel = oLevel[sRelation].include;
      });
    }

    return oInclude;
  }

  /** `"a, b,"` → `['a', 'b']` */
  private static list(sList: string): string[] {
    return sList
      .split(',')
      .map(sItem => sItem.trim())
      .filter(Boolean);
  }
}
