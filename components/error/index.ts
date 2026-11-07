import { createController } from '@nano-app/frontend';
import type { ApiError, ComponentContext } from '@nano-app/frontend';

/** The errors of every api store, from the newest */
function items({ stores }: ComponentContext): ApiError[] {
  return Object.values(stores)
    .flatMap(oStore => oStore.get('/error/list') ?? [])
    .sort((oA: ApiError, oB: ApiError) => oB.timestamp - oA.timestamp);
}

/** Removes an error of the items from the store that has it */
function remove(oContext: ComponentContext, iIndex: number): void {
  const oError = items(oContext)[iIndex];
  for (const oStore of Object.values(oContext.stores)) {
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
  return createController(oContext => ({
    items: () => items(oContext),
    remove: (iIndex: number) => remove(oContext, iIndex),
    // The newest error of all the stores, and its removal
    last: () => items(oContext)[0],
    dismiss: () => remove(oContext, 0),
    clear: () => {
      // Empties the errors of every store that has them
      for (const oStore of Object.values(oContext.stores)) {
        if (oStore.get('/error/list')) oStore.set('/error/list', []);
      }
    },
  }));
}
