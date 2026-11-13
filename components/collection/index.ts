import { createController } from '@nano-app/frontend';
import { DEFAULT_STORE } from '@nano-app/core/const';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import Pages from './Pages';
import type { CollectionOptions } from '../types/collection';

/** A backend path read by pages, sortable, also page after page; its state is at `/collection` */
export default function collection(oOptions: CollectionOptions) {
  const { path, limit, store = DEFAULT_STORE } = oOptions;

  return createController(({ stores }) => {
    // Takes the api store of the options
    const oApi = stores[store];

    return {
      // Reads the page and shows its pages while mounted
      callbacks: {
        onMount(): Promise<ApiResponse> {
          Pages.of(oApi, path, this.pagesQuery()).watch();
          return this.load();
        },
        onUnmount(): void {
          Pages.of(oApi, path, this.pagesQuery()).unwatch();
        },
      },
      page(): number {
        // The page chosen by the user, from 0
        return oApi.get('/collection/page') ?? 0;
      },
      query(): QueryParams {
        // The query of the pages, from the current page
        return { offset: this.page() * limit, ...this.pagesQuery() };
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
        await Pages.of(oApi, path, this.pagesQuery()).next();
        return this.pages() ?? {};
      },
      pages(): ApiResponse | undefined {
        // Every page read so far with `more`, its items in one list
        return oApi.get(path, this.pagesQuery());
      },
      pagesQuery(): QueryParams {
        // The page size and the order chosen by the user, without the page
        return { limit, orderBy: oApi.get('/collection/orderBy') };
      },
      async goTo(iPage: number): Promise<ApiResponse> {
        // Moves to a page, never before the first one, and reads it
        oApi.set('/collection/page', Math.max(iPage, 0));
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
        // Toggles the order of the field and shows its pages
        const sDirection = oApi.get('/collection/orderBy')?.[sField] === 'asc' ? 'desc' : 'asc';
        Pages.of(oApi, path, this.pagesQuery()).unwatch();
        oApi.set('/collection/orderBy', { [sField]: sDirection });
        Pages.of(oApi, path, this.pagesQuery()).watch();

        // Reads the first page
        return this.goTo(0);
      },
    };
  });
}
