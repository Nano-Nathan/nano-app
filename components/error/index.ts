import { Controller } from '@nano-app/frontend';
import type { ApiError, Store } from '@nano-app/frontend';

/** The failed requests of every api store, from their `/error/list` */
export default class ErrorController extends Controller {
  /** The errors of every store, from the newest */
  public items(): ApiError[] {
    return this.all()
      .flatMap(oStore => oStore.get('/error/list') ?? [])
      .sort((oA: ApiError, oB: ApiError) => oB.timestamp - oA.timestamp);
  }

  /** Removes an error of the items from the store that has it */
  public remove(iIndex: number): void {
    const oError = this.items()[iIndex];
    for (const oStore of this.all()) {
      const aList: ApiError[] = oStore.get('/error/list') ?? [];
      if (aList.includes(oError))
        oStore.set(
          '/error/list',
          aList.filter(oItem => oItem !== oError),
        );
    }
  }

  /** The newest error of all the stores */
  public last(): ApiError | undefined {
    return this.items()[0];
  }

  /** Removes the newest error */
  public dismiss(): void {
    this.remove(0);
  }

  /** Empties the errors of every store that has them */
  public clear(): void {
    for (const oStore of this.all()) {
      if (oStore.get('/error/list')) oStore.set('/error/list', []);
    }
  }

  /** Every store of the app */
  private all(): Store[] {
    return Object.values(this.stores);
  }
}
