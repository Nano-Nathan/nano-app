import { createController } from '@nano-app/frontend';
import type { ApiError, Controller } from '@nano-app/frontend';
import type { ErrorMethods } from '../types/error';

/** The failed requests of every api store, from their `/error/list` */
export default function error(): Controller<ErrorMethods> {
  return createController(({ stores }) => {
    // Takes the stores, and the errors of all of them
    const aStores = Object.values(stores);
    const fnItems = (): ApiError[] => aStores.flatMap(oStore => oStore.get('/error/list') ?? []);

    return {
      items: fnItems,
      // The last error of all the stores
      last: () => fnItems().at(-1),
      dismiss: (oError: ApiError) => {
        // Removes the error from the store that has it
        for (const oStore of aStores) {
          const aList: ApiError[] | undefined = oStore.get('/error/list');
          if (aList?.includes(oError))
            oStore.set(
              '/error/list',
              aList.filter(oItem => oItem !== oError),
            );
        }
      },
      clear: () => {
        // Empties the errors of every store that has them
        for (const oStore of aStores) {
          if (oStore.get('/error/list')) oStore.set('/error/list', []);
        }
      },
    };
  });
}
