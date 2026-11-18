import { Controller } from '@nano-app/frontend';
import type { Store } from '@nano-app/frontend';

/** Controller with its state under `root` in a store, `app` by default */
export default class AppController extends Controller {
  /** Store of its state (`app` by default; `protected state = this.stores.ui;`) */
  protected state: Store = this.stores.app;
  /** Path of its state in `state`; none by default */
  protected root: string = '';

  /** `state.get` of a path under `root` */
  protected get(sPath: string): any {
    return this.state.get(`${this.root}${sPath}`);
  }

  /** `state.set` of a path under `root` */
  protected set(sPath: string, oValue: unknown): void {
    this.state.set(`${this.root}${sPath}`, oValue);
  }

  /** The text of a key (`nano.login.title`) in the app's locale, from the `app` store whatever its `state` */
  public text(sKey: string): string {
    return this.stores.app.text(sKey);
  }

  /** Whether its flag is on: one on/off state of the controller, at `<root>/isToggled` */
  public isToggled(): boolean {
    return this.get('/isToggled') ?? false;
  }

  /** Switches its flag on or off */
  public toggle(): void {
    this.set('/isToggled', !this.isToggled());
  }
}
