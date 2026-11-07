import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { ComponentContext } from '@nano-app/frontend';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { ListOptions } from '../types/list';

/** Api store of the options */
function api(
  { stores }: ComponentContext,
  oOptions: ListOptions,
): ComponentContext['stores'][string] {
  return stores[oOptions.store ?? API_STORE_TYPE];
}

/** Page chosen by the user, from 0 */
function page(oContext: ComponentContext, oOptions: ListOptions): number {
  return api(oContext, oOptions)?.get('/list/page') ?? 0;
}

/** Query of the page and the order chosen by the user */
function query(oContext: ComponentContext, oOptions: ListOptions): QueryParams {
  const { top } = oOptions;
  const orderby = api(oContext, oOptions)?.get('/list/orderby');
  return { skip: page(oContext, oOptions) * top, top, orderby };
}

/** Reads the current page from the backend */
async function read(
  oContext: ComponentContext,
  oOptions: ListOptions,
): Promise<ApiResponse | undefined> {
  return api(oContext, oOptions)?.read(oOptions.path, query(oContext, oOptions));
}

/** Moves to a page and reads it */
async function goTo(
  oContext: ComponentContext,
  oOptions: ListOptions,
  iPage: number,
): Promise<ApiResponse | undefined> {
  api(oContext, oOptions)?.set('/list/page', iPage);
  return read(oContext, oOptions);
}

/** A paged and sortable list of a backend path; its state lives at `/list` of its api store */
export default function list(oOptions: ListOptions) {
  return createController(oContext => ({
    load: async () => read(oContext, oOptions),
    // The answer kept for the current page
    items: () => api(oContext, oOptions)?.get(oOptions.path, query(oContext, oOptions)),
    // Moves the page forward or back, never before the first one, and reads it
    next: async () => goTo(oContext, oOptions, page(oContext, oOptions) + 1),
    prev: async () => goTo(oContext, oOptions, Math.max(page(oContext, oOptions) - 1, 0)),
    sort: async (sField: string) => {
      // Toggles the field between ascending and descending, and reads the first page
      const oApi = api(oContext, oOptions);
      const sDirection = oApi?.get('/list/orderby')?.[sField] === 'asc' ? 'desc' : 'asc';
      oApi?.set('/list/orderby', { [sField]: sDirection });
      return goTo(oContext, oOptions, 0);
    },
    // Reads the current page when the view mounts
    callbacks: { onMount: () => read(oContext, oOptions) },
  }));
}
