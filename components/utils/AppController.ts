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
}
