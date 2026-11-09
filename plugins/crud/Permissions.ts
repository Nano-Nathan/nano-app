import type { NanoObject, QueryParams } from '@nano-app/backend';
import type { DataModels } from '../types/crud';

/** Better Auth permissions a crud request needs: its action on its model, and on every related model it reaches */
export default class Permissions {
  private oModels: DataModels;

  /** Permissions over the models of the app's Prisma client */
  constructor(oModels: DataModels) {
    this.oModels = oModels;
  }

  /** `{ note: ['update'], comment: ['update'] }`: reads need `read` on each relation, writes their own action */
  public of(sModel: string, sAction: string, oBody: NanoObject): NanoObject<string[]> {
    // The model of the URL, by its delegate name (`note` → `Note`)
    const sName = Object.keys(this.oModels).find(sItem => Permissions.delegate(sItem) === sModel);
    const { filter, expand, select, orderby }: QueryParams = oBody;

    // A write reaches the relations of its data; a read, those of its filter, expand, select and orderby
    const isWrite = sAction === 'create' || sAction === 'update';
    const aFound = isWrite
      ? this.walk(sName, oBody)
      : [
          ...this.walk(sName, filter),
          ...Permissions.paths(expand, select, orderby).flatMap(sPath =>
            this.follow(sName, sPath.split('.')),
          ),
        ];

    // Its action on its model and on each related model (`read` for reads; a delete reaches none)
    const aRelated = [...new Set(aFound)].map(sItem => [Permissions.delegate(sItem), [sAction]]);
    return { ...Object.fromEntries(aRelated), [sModel]: [sAction] };
  }

  /** Models of the relations a filter or a data object names, at any depth */
  private walk(sName: string | undefined, oValue: unknown): string[] {
    // Walks arrays and objects; anything else names no relation
    if (Array.isArray(oValue)) return oValue.flatMap(oItem => this.walk(sName, oItem));
    if (!oValue || typeof oValue !== 'object') return [];

    // A key that is a relation adds its model and goes on inside it; any other key, inside the same model
    return Object.entries(oValue).flatMap(([sKey, oItem]) => {
      const sRelation = this.relation(sName, sKey);
      const aInside = this.walk(sRelation ?? sName, oItem);
      return sRelation ? [sRelation, ...aInside] : aInside;
    });
  }

  /** Models along a dot path of relations (`user.accounts`), up to the first segment that is not one */
  private follow(sName: string | undefined, aPath: string[]): string[] {
    // Stops at the first segment that is not a relation of the model
    const [sKey, ...aRest] = aPath;
    const sRelation = this.relation(sName, sKey);
    if (!sRelation) return [];

    // Its model, and those along the rest of the path
    return [sRelation, ...this.follow(sRelation, aRest)];
  }

  /** Model of a relation field of a model, or undefined when the field is not a relation */
  private relation(sName: string | undefined, sField: string): string | undefined {
    // Finds the field and keeps its model when it is a relation
    const oField = this.oModels[sName ?? '']?.fields.find(({ name }) => name === sField);
    return oField?.kind === 'object' ? oField.type : undefined;
  }

  /** Paths of the relations an `expand`, a `select` and an `orderby` may name */
  private static paths(sExpand?: string, sSelect?: string, oOrderby?: NanoObject): string[] {
    // The items of the lists and the keys of the order, trimmed
    const aLists = [sExpand, sSelect].flatMap(sList => sList?.split(',') ?? []);
    return [...aLists, ...Object.keys(oOrderby ?? {})].map(sPath => sPath.trim());
  }

  /** Delegate name of a model, as the client and Better Auth's resources name it (`Note` → `note`) */
  private static delegate(sName: string): string {
    return `${sName[0].toLowerCase()}${sName.slice(1)}`;
  }
}
