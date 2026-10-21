import type { NanoObject } from '@nano-app/core/types/objects';

/** State of one store, read and written by path (`/drawer/isOpen`) */
export default class Store {
  private sName: string;
  private oState: NanoObject;

  /** `oState` is the store's branch of the shared state, so writes stay reactive */
  constructor(sName: string, oState: NanoObject) {
    this.sName = sName;
    this.oState = oState;
  }

  /** Value at a path, from a snapshot of the whole state when there is one (that binds the render) */
  // any: the value is the consumer's, unknown to the framework
  public get(sPath: string, oSnapshot?: NanoObject): any {
    // Reads the store's branch: the snapshot's, or the live state
    const oBranch = oSnapshot?.[this.sName] ?? this.oState;

    // Walks down the path
    return Store.keys(sPath).reduce((oValue, sKey) => oValue?.[sKey], oBranch);
  }

  /** Writes a value at a path, creating the levels that are missing */
  public set(sPath: string, oValue: unknown): void {
    // Splits the path into its parent levels and the last key
    const aKeys = Store.keys(sPath);
    const sLast = aKeys.pop();
    if (!sLast) return;

    // Walks down the parents, creating them, and writes the last key
    const oParent = aKeys.reduce((oLevel, sKey) => (oLevel[sKey] ??= {}), this.oState);
    oParent[sLast] = oValue;
  }

  /** Keys of a path, with or without the leading slash */
  private static keys(sPath: string): string[] {
    return sPath.split('/').filter(Boolean);
  }
}
