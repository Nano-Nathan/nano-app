import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { Controller } from '@nano-app/frontend';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { ListMethods, ListOptions } from '../types/list';

/** A paged and sortable list of a backend path; its state lives at `/list` of its api store */
export default function list(oOptions: ListOptions): Controller<ListMethods> {
  const { path, top, store = API_STORE_TYPE } = oOptions;

  return createController(({ stores }) => {
    // Takes the api store of the options, and the query of the page and order chosen by the user
    const oApi = stores[store];
    const fnPage = (): number => oApi?.get('/list/page') ?? 0;
    const fnQuery = (): QueryParams => ({
      skip: fnPage() * top,
      top,
      orderby: oApi?.get('/list/orderby'),
    });

    // Reads the current page from the backend
    const fnLoad = async (): Promise<ApiResponse | undefined> => oApi?.read(path, fnQuery());

    return {
      load: fnLoad,
      // The answer kept for the current page
      items: () => oApi?.get(path, fnQuery()),
      // Moves the page forward or back, never before the first one, and reads it
      next: async () => {
        oApi?.set('/list/page', fnPage() + 1);
        return fnLoad();
      },
      prev: async () => {
        oApi?.set('/list/page', Math.max(fnPage() - 1, 0));
        return fnLoad();
      },
      sort: async (sField: string) => {
        // Toggles the field between ascending and descending, goes back to the first page and reads it
        const sDirection = oApi?.get('/list/orderby')?.[sField] === 'asc' ? 'desc' : 'asc';
        oApi?.set('/list/orderby', { [sField]: sDirection });
        oApi?.set('/list/page', 0);
        return fnLoad();
      },
    };
  });
}
