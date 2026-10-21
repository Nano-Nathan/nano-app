import type { NanoObject } from '@nano-app/core/types/objects';

/** State of one store, read and written by path (`/drawer/isOpen`) */
export default class Store {
  private oState: NanoObject;

  /** `oState` is the store's branch of the shared state, so writes stay reactive */
  constructor(oState: NanoObject) {
    this.oState = oState;
  }

  /** Value at a path */
  // any: the value is the consumer's, unknown to the framework
  public get(sPath: string): any {
    // Walks down the path
    return Store.keys(sPath).reduce((oValue, sKey) => oValue?.[sKey], this.oState);
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
