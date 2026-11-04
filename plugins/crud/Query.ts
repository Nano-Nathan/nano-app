import type { NanoObject, QueryParams } from '@nano-app/backend';

/** Records a list answers when the request sends no `top` */
const DEFAULT_TOP = 100;

/** Arguments of a Prisma `findMany` */
export type PrismaArgs = {
  where?: NanoObject;
  orderBy?: NanoObject[];
  take: number;
  skip?: number;
  select?: NanoObject<true>;
};

/** Translates core's `QueryParams` into the arguments of Prisma */
export default abstract class Query {
  /** `filter` → `where`, `orderby` → `orderBy`, `top`/`skip` → `take`/`skip`, `select` → `select` */
  public static toPrisma(oQuery: QueryParams = {}): PrismaArgs {
    const { filter, orderby, top, skip, select } = oQuery;

    // 100 by default; the client may ask for any amount
    const oArgs: PrismaArgs = { take: top ?? DEFAULT_TOP };

    // Prisma's operators as they are
    if (filter) oArgs.where = filter;

    // The fields in the order they were sent
    if (orderby) oArgs.orderBy = Query.orderBy(orderby);

    // Records to leave out, as they are
    if (skip !== undefined) oArgs.skip = skip;

    // Only the fields of the model itself
    if (select) oArgs.select = Query.select(select);

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
    const aFields = sSelect
      .split(',')
      .map(sField => sField.trim())
      .filter(Boolean);
    return Object.fromEntries(aFields.map(sField => [sField, true]));
  }
}
