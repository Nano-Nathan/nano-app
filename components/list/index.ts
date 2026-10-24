import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { Controller } from '@nano-app/frontend';
import type { ListMethods, ListOptions } from '../types/list';

/** A paged and sortable list of a backend path; its state lives at `/list` of its api store */
export default function list(oOptions: ListOptions): Controller<ListMethods> {
  const { path, top, store = API_STORE_TYPE } = oOptions;

  return createController(({ stores }) => {
    // Takes the api store of the options, and reads the page chosen by the user from it
    const oApi = stores[store];
    const fnPage = (): number => oApi?.get('/list/page') ?? 0;

    return {
      items: () => {
        // Reads the page from the backend, with the order chosen by the user
        const oQuery = { skip: fnPage() * top, top, orderby: oApi?.get('/list/orderby') };
        return oApi?.read(path, oQuery);
      },
      // Moves the page forward or back, never before the first one
      next: () => oApi?.set('/list/page', fnPage() + 1),
      prev: () => oApi?.set('/list/page', Math.max(fnPage() - 1, 0)),
      sort: (sField: string) => {
        // Toggles the field between ascending and descending, and goes back to the first page
        const sDirection = oApi?.get('/list/orderby')?.[sField] === 'asc' ? 'desc' : 'asc';
        oApi?.set('/list/orderby', { [sField]: sDirection });
        oApi?.set('/list/page', 0);
      },
    };
  });
}
