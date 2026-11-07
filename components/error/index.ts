import { createController } from '@nano-app/frontend';
import type { ApiError } from '@nano-app/frontend';

/** The failed requests of every api store, from their `/error/list` */
export default function error() {
  return createController(({ stores }) => {
    // Takes the stores
    const aStores = Object.values(stores);

    return {
      items(): ApiError[] {
        // The errors of every store, from the newest
        return aStores
          .flatMap(oStore => oStore.get('/error/list') ?? [])
          .sort((oA: ApiError, oB: ApiError) => oB.timestamp - oA.timestamp);
      },
      remove(iIndex: number): void {
        // Removes an error of the items from the store that has it
        const oError = this.items()[iIndex];
        for (const oStore of aStores) {
          const aList: ApiError[] = oStore.get('/error/list') ?? [];
          if (aList.includes(oError))
            oStore.set(
              '/error/list',
              aList.filter(oItem => oItem !== oError),
            );
        }
      },
      // The newest error of all the stores, and its removal
      last(): ApiError | undefined {
        return this.items()[0];
      },
      dismiss(): void {
        // Removes the newest error
        this.remove(0);
      },
      clear(): void {
        // Empties the errors of every store that has them
        for (const oStore of aStores) {
          if (oStore.get('/error/list')) oStore.set('/error/list', []);
        }
      },
    };
  });
}
