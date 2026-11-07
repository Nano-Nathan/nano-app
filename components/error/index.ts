import { createController } from '@nano-app/frontend';
import type { ApiError, ComponentContext } from '@nano-app/frontend';

/** The errors of the stores, from the newest */
function items(aStores: ComponentContext['stores'][string][]): ApiError[] {
  return aStores
    .flatMap(oStore => oStore.get('/error/list') ?? [])
    .sort((oA: ApiError, oB: ApiError) => oB.timestamp - oA.timestamp);
}

/** Removes an error of the items from the store that has it */
function remove(aStores: ComponentContext['stores'][string][], iIndex: number): void {
  const oError = items(aStores)[iIndex];
  for (const oStore of aStores) {
    const aList: ApiError[] = oStore.get('/error/list') ?? [];
    if (aList.includes(oError))
      oStore.set(
        '/error/list',
        aList.filter(oItem => oItem !== oError),
      );
  }
}

/** The failed requests of every api store, from their `/error/list` */
export default function error() {
  return createController(({ stores }) => {
    // Takes the stores
    const aStores = Object.values(stores);

    return {
      items: () => items(aStores),
      remove: (iIndex: number) => remove(aStores, iIndex),
      // The newest error of all the stores, and its removal
      last: () => items(aStores)[0],
      dismiss: () => remove(aStores, 0),
      clear: () => {
        // Empties the errors of every store that has them
        for (const oStore of aStores) {
          if (oStore.get('/error/list')) oStore.set('/error/list', []);
        }
      },
    };
  });
}
