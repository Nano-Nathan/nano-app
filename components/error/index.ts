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
      dismiss: () => {
        // Removes the last error from the last store that has errors
        const oStore = aStores.filter(oItem => oItem.get('/error/list')?.length).at(-1);
        oStore?.set('/error/list', oStore.get('/error/list').slice(0, -1));
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
