import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { ComponentContext } from '@nano-app/frontend';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { ListOptions } from '../types/list';

/** Page chosen by the user, from 0 */
function page(oApi: ComponentContext['stores'][string]): number {
  return oApi?.get('/list/page') ?? 0;
}

/** Query of the page and the order chosen by the user */
function query(oApi: ComponentContext['stores'][string], iTop: number): QueryParams {
  return { skip: page(oApi) * iTop, top: iTop, orderby: oApi?.get('/list/orderby') };
}

/** Reads the current page from the backend */
async function read(
  oApi: ComponentContext['stores'][string],
  oOptions: ListOptions,
): Promise<ApiResponse | undefined> {
  return oApi?.read(oOptions.path, query(oApi, oOptions.top));
}

/** Moves to a page and reads it */
async function goTo(
  oApi: ComponentContext['stores'][string],
  oOptions: ListOptions,
  iPage: number,
): Promise<ApiResponse | undefined> {
  oApi?.set('/list/page', iPage);
  return read(oApi, oOptions);
}

/** A paged and sortable list of a backend path; its state lives at `/list` of its api store */
export default function list(oOptions: ListOptions) {
  const { path, top, store = API_STORE_TYPE } = oOptions;

  return createController(({ stores }) => {
    // Takes the api store of the options
    const oApi = stores[store];

    return {
      // Reads the current page, and gives the answer kept for it
      load: async () => read(oApi, oOptions),
      items: () => oApi?.get(path, query(oApi, top)),
      // Moves the page forward or back, never before the first one, and reads it
      next: async () => goTo(oApi, oOptions, page(oApi) + 1),
      prev: async () => goTo(oApi, oOptions, Math.max(page(oApi) - 1, 0)),
      sort: async (sField: string) => {
        // Toggles the field between ascending and descending, and reads the first page
        const sDirection = oApi?.get('/list/orderby')?.[sField] === 'asc' ? 'desc' : 'asc';
        oApi?.set('/list/orderby', { [sField]: sDirection });
        return goTo(oApi, oOptions, 0);
      },
      // Reads the current page when the view mounts
      callbacks: { onMount: () => read(oApi, oOptions) },
    };
  });
}
