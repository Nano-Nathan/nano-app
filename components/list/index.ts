import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { ListOptions } from '../types/list';

/** A paged, sortable list of a backend path, also read page after page; its state is at `/list` */
export default function list(oOptions: ListOptions) {
  const { path, top, store = API_STORE_TYPE } = oOptions;

  return createController(({ stores }) => {
    // Takes the api store of the options
    const oApi = stores[store];

    return {
      // Reads the current page when the view mounts
      callbacks: {
        onMount(): Promise<ApiResponse> {
          return this.load();
        },
      },
      page(): number {
        // The page chosen by the user, from 0
        return oApi.get('/list/page') ?? 0;
      },
      query(): QueryParams {
        // The query of the page and the order chosen by the user
        return { skip: this.page() * top, top, orderby: oApi.get('/list/orderby') };
      },
      async load(): Promise<ApiResponse> {
        // Reads the current page
        return oApi.read(path, this.query());
      },
      items(): ApiResponse | undefined {
        // The answer kept for the current page
        return oApi.get(path, this.query());
      },
      async more(): Promise<ApiResponse> {
        // Adds the next page to the pages read so far, in the order chosen by the user
        return oApi.more(path, this.pagesQuery());
      },
      loaded(): ApiResponse | undefined {
        // Every page read so far with `more`, its items in one list
        return oApi.get(path, this.pagesQuery());
      },
      pagesQuery(): QueryParams {
        // The query of the pages read with `more`: every item from the first, in the chosen order
        return { top, orderby: oApi.get('/list/orderby') };
      },
      async goTo(iPage: number): Promise<ApiResponse> {
        // Moves to a page, never before the first one, and reads it
        oApi.set('/list/page', Math.max(iPage, 0));
        return this.load();
      },
      async next(): Promise<ApiResponse> {
        // Reads the next page
        return this.goTo(this.page() + 1);
      },
      async prev(): Promise<ApiResponse> {
        // Reads the page before, or the first one
        return this.goTo(this.page() - 1);
      },
      async sort(sField: string): Promise<ApiResponse> {
        // Toggles the field between ascending and descending, and reads the first page
        const sDirection = oApi.get('/list/orderby')?.[sField] === 'asc' ? 'desc' : 'asc';
        oApi.set('/list/orderby', { [sField]: sDirection });
        return this.goTo(0);
      },
    };
  });
}
