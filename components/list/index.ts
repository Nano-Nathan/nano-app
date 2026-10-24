import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { Controller } from '@nano-app/frontend';
import type { ListMethods, ListOptions } from '../types/list';

/** A paged and sortable list of a backend path; its state lives at `/list` of its api store */
export default function list(oOptions: ListOptions): Controller<ListMethods> {
  const { path, top, store = API_STORE_TYPE } = oOptions;

  return createController(({ stores }) => {
    // Takes the api store of the options
    const oApi = stores[store];

    // Reads the page and the order chosen by the user
    const iPage: number = oApi?.get('/list/page') ?? 0;
    const oOrderby = oApi?.get('/list/orderby');

    return {
      // Reads the page from the backend, with the order
      items: oApi?.read(path, { skip: iPage * top, top, orderby: oOrderby }),
      page: iPage,
      busy: oApi?.busy ?? 0,
      next: () => oApi?.set('/list/page', iPage + 1),
      prev: () => oApi?.set('/list/page', Math.max(iPage - 1, 0)),
      sort: (sField: string) => {
        // Toggles the field between ascending and descending, and goes back to the first page
        const sDirection = oOrderby?.[sField] === 'asc' ? 'desc' : 'asc';
        oApi?.set('/list/orderby', { [sField]: sDirection });
        oApi?.set('/list/page', 0);
      },
    };
  });
}
