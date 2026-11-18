import { Controller } from '@nano-app/frontend';
import type { ApiMessage, Store } from '@nano-app/frontend';

/** The messages of the answers of every api store, and its failed requests, from their `/message/list` */
export default class MessageController extends Controller {
  /** The messages of every store, from the newest */
  public items(): ApiMessage[] {
    return this.all()
      .flatMap(oStore => oStore.get('/message/list') ?? [])
      .sort((oA: ApiMessage, oB: ApiMessage) => oB.timestamp - oA.timestamp);
  }

  /** Removes a message of the items from the store that has it */
  public remove(iIndex: number): void {
    const oMessage = this.items()[iIndex];
    for (const oStore of this.all()) {
      const aList: ApiMessage[] = oStore.get('/message/list') ?? [];
      if (aList.includes(oMessage))
        oStore.set(
          '/message/list',
          aList.filter(oItem => oItem !== oMessage),
        );
    }
  }

  /** The newest message of all the stores */
  public last(): ApiMessage | undefined {
    return this.items()[0];
  }

  /** Removes the newest message */
  public dismiss(): void {
    this.remove(0);
  }

  /** Empties the messages of every store that has them */
  public clear(): void {
    for (const oStore of this.all()) {
      if (oStore.get('/message/list')) oStore.set('/message/list', []);
    }
  }

  /** Every store of the app */
  private all(): Store[] {
    return Object.values(this.stores);
  }
}
