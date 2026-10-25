import { createController } from '@nano-app/frontend';
import type { ApiError, Controller } from '@nano-app/frontend';
import type { ErrorMethods } from '../types/error';

/** The failed requests of every api store, from their `/error/list` */
export default function error(): Controller<ErrorMethods> {
  return createController(({ stores }) => {
    // Takes the stores, and the errors of all of them from the newest
    const aStores = Object.values(stores);
    const fnItems = (): ApiError[] =>
      aStores
        .flatMap(oStore => oStore.get('/error/list') ?? [])
        .sort((oA: ApiError, oB: ApiError) => oB.timestamp - oA.timestamp);

    // Removes an error of the items from the store that has it
    const fnRemove = (iIndex: number): void => {
      const oError = fnItems()[iIndex];
      for (const oStore of aStores) {
        const aList: ApiError[] = oStore.get('/error/list') ?? [];
        if (aList.includes(oError))
          oStore.set(
            '/error/list',
            aList.filter(oItem => oItem !== oError),
          );
      }
    };

    return {
      items: fnItems,
      remove: fnRemove,
      // The newest error of all the stores, and its removal
      last: () => fnItems()[0],
      dismiss: () => fnRemove(0),
      clear: () => {
        // Empties the errors of every store that has them
        for (const oStore of aStores) {
          if (oStore.get('/error/list')) oStore.set('/error/list', []);
        }
      },
    };
  });
}
