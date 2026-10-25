import { createController } from '@nano-app/frontend';
import type { Controller } from '@nano-app/frontend';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { ErrorMethods } from '../types/error';

/** The failed requests of every api store, from their `/error/list` */
export default function error(): Controller<ErrorMethods> {
  return createController(({ stores }) => {
    // Takes the stores, and the errors of all of them
    const aStores = Object.values(stores);
    const fnItems = (): ApiResponse[] => aStores.flatMap(oStore => oStore.get('/error/list') ?? []);

    return {
      items: fnItems,
      // The last error of all the stores
      last: () => fnItems().at(-1),
      dismiss: (oError: ApiResponse) => {
        // Removes the error from the store that has it
        for (const oStore of aStores) {
          const aList: ApiResponse[] | undefined = oStore.get('/error/list');
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
