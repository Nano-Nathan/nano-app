import { observable, runInAction } from 'mobx';
import { DEFAULT_LOCALE } from '../const';
import type { NanoObject } from '@nano-app/core/types/objects';

/** State of one store, read and written by path (`/drawer/isOpen`) */
export default class Store {
  private oState: NanoObject;

  /** Makes the store's initial data observable, so reads are tracked and writes notify them */
  constructor(oData: NanoObject = {}) {
    this.oState = observable(oData);
  }

  /** Value at a path: an object comes back observable, so reading its fields stays tracked */
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

    // Creates the missing parents and writes the last key
    runInAction(() => {
      const oParent = aKeys.reduce((oLevel, sKey) => {
        // Reads the level back: MobX stores an observable copy, not the `{}` assigned
        oLevel[sKey] ??= {};
        return oLevel[sKey];
      }, this.oState);
      oParent[sLast] = oValue;
    });
  }

  /** The text of a key (`nano.login.title`) in the locale at `/locale` (`en` by default), from `/i18n`; the key itself without one */
  public text(sKey: string): string {
    const sLocale = this.get('/locale') ?? DEFAULT_LOCALE;
    return this.get(`/i18n/${sLocale}/${sKey}`) ?? `i18n.${sKey}`;
  }

  /** Keys of a path, with or without the leading slash */
  private static keys(sPath: string): string[] {
    return sPath.split('/').filter(Boolean);
  }
}
