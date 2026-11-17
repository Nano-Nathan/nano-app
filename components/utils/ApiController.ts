import { Controller } from '@nano-app/frontend';
import { DEFAULT_STORE } from '@nano-app/core/const';
import type { ApiStore } from '@nano-app/frontend';

/** Controller of a component that reads an api store, named in `store` */
export default class ApiController extends Controller {
  /** Name of the api store it reads (`api` by default) */
  public store: string = DEFAULT_STORE;

  /** The api store of a name, `store` by default */
  protected api(sName: string = this.store): ApiStore {
    return Reflect.get(this.stores, sName);
  }
}
