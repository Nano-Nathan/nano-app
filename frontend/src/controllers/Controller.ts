import { DEFAULT_LOCALE } from '../const';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ComponentContext } from '../types/component';

/** Logic of a view: methods on the props, the stores and the router, extended by the app */
export default class Controller {
  /** Props of the view, as of the last render on screen */
  public props: ComponentContext['props'];
  /** Stores of the app */
  public readonly stores: ComponentContext['stores'];
  /** Next's router */
  public readonly router: ComponentContext['router'];

  /** Takes the view's context and binds every method, so a view can pass one alone */
  constructor(oContext: ComponentContext) {
    // Takes the context of the view
    this.props = oContext.props;
    this.stores = oContext.stores;
    this.router = oContext.router;

    // Binds each method once, the last override of each name first
    const oSelf: NanoObject = this;
    for (
      let oProto = Object.getPrototypeOf(this);
      oProto !== Controller.prototype;
      oProto = Object.getPrototypeOf(oProto)
    ) {
      for (const sName of Object.getOwnPropertyNames(oProto)) {
        const oValue = Object.getOwnPropertyDescriptor(oProto, sName)?.value;
        const isSkipped = sName === 'constructor' || typeof oValue !== 'function';
        if (isSkipped || Object.hasOwn(this, sName)) continue;
        oSelf[sName] = oSelf[sName].bind(this);
      }
    }
  }

  /** The text of a key (`nano.login.title`) in the locale at `/locale` of the app store, `en` by default; `i18n.<key>` without one */
  public text(sKey: string): string {
    // The texts live in the app store, by locale
    const { app } = this.stores;
    const sLocale = app.get('/locale') ?? DEFAULT_LOCALE;
    return app.get(`/i18n/${sLocale}/${sKey}`) ?? `i18n.${sKey}`;
  }

  /** Runs once when the view mounts, never on the server */
  public onMount(): void {}

  /** Runs once when the view unmounts */
  public onUnmount(): void {}
}
