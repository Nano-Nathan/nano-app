import type { NanoObject, QueryParams } from '@nano-app/backend';

/** Better Auth permissions a crud request needs: its action on its table, and `read` on every related table a read reaches */
export default class Permissions {
  private oRelations: NanoObject;

  /** Permissions over the relations of the app's Drizzle schema (`defineRelations`) */
  constructor(oRelations: NanoObject) {
    this.oRelations = oRelations;
  }

  /** `{ notes: ['read'], comments: ['read'] }`: a read needs `read` on each relation its filter and expand reach */
  public of(sModel: string, sAction: string, oBody: NanoObject): NanoObject<string[]> {
    // A write reaches only its table: Drizzle has no nested writes
    if (sAction !== 'read') return { [sModel]: [sAction] };

    // The relations of the filter, and those along each path of the expand
    const { filter, expand }: QueryParams = oBody;
    const aFound = [
      ...this.walk(sModel, filter),
      ...(expand?.split(',') ?? []).flatMap(sPath => this.follow(sModel, sPath.trim().split('.'))),
    ];

    // `read` on each related table and on its own
    const aRelated = [...new Set(aFound)].map(sTable => [sTable, ['read']]);
    return { ...Object.fromEntries(aRelated), [sModel]: ['read'] };
  }

  /** Tables of the relations a filter names, at any depth */
  private walk(sTable: string, oValue: unknown): string[] {
    // Walks arrays and objects; anything else names no relation
    if (Array.isArray(oValue)) return oValue.flatMap(oItem => this.walk(sTable, oItem));
    if (!oValue || typeof oValue !== 'object') return [];

    // A key that is a relation adds its table and goes on inside it; any other key, inside the same table
    return Object.entries(oValue).flatMap(([sKey, oItem]) => {
      const sTarget = this.target(sTable, sKey);
      const aInside = this.walk(sTarget ?? sTable, oItem);
      return sTarget ? [sTarget, ...aInside] : aInside;
    });
  }

  /** Tables along a dot path of relations (`user.accounts`), up to the first segment that is not one */
  private follow(sTable: string, aPath: string[]): string[] {
    // Stops at the first segment that is not a relation of the table
    const [sKey, ...aRest] = aPath;
    const sTarget = this.target(sTable, sKey);
    if (!sTarget) return [];

    // Its table, and those along the rest of the path
    return [sTarget, ...this.follow(sTarget, aRest)];
  }

  /** Table a relation of a table points to, by its key in the schema; undefined when the key is not a relation */
  private target(sTable: string, sKey: string): string | undefined {
    return this.oRelations[sTable]?.relations[sKey]?.targetTableName;
  }
}
