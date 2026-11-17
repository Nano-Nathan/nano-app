import { Controller } from '@nano-app/frontend';

/** Methods of the counter: they write the app store */
export default class CounterController extends Controller {
  /** Adds one */
  public increment(): void {
    this.update(1);
  }

  /** Adds the value */
  public update(iValue: number): void {
    const { app } = this.stores;
    app.set('/iCount', app.get('/iCount') + iValue);
  }
}
