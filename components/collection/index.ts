import { createController } from '@nano-app/frontend';
import { DEFAULT_STORE } from '@nano-app/core/const';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { CollectionOptions } from '../types/collection';

/** A backend path read by pages or page after page; its page and order at `/collection/<name>` */
export default function collection(oOptions: CollectionOptions) {
  const { name, path, limit, store = DEFAULT_STORE } = oOptions;
  const sState = `/collection/${name}`;

  return createController(({ stores }) => {
    // Takes the api store of the options, and the app store of its state
    const oApi = stores[store];
    const { app } = stores;

    return {
      // Reads the page when the view mounts
      callbacks: {
        onMount(): Promise<ApiResponse> {
          return this.load();
        },
      },
      page(): number {
        // The page chosen by the user, from 0
        return app.get(`${sState}/page`) ?? 0;
      },
      query(): QueryParams {
        // The query of the current page, in the order chosen by the user
        return { offset: this.page() * limit, ...this.pagesQuery() };
      },
      async load(): Promise<ApiResponse> {
        // Reads the current page
        return oApi.QUERY(path, this.query());
      },
      items(): ApiResponse | undefined {
        // The answer of the current page
        return oApi.get(path, this.query());
      },
      async more(): Promise<ApiResponse> {
        // Reads the page after the items read so far
        const aItems = this.pages()?.result ?? [];
        const oResponse = await oApi.QUERY(path, { ...this.pagesQuery(), offset: aItems.length });

        // Keeps every item read so far in one answer
        const oPages = { ...oResponse, result: [...aItems, ...(oResponse.result ?? [])] };
        oApi.set(`${sState}/pages`, oPages);
        return oPages;
      },
      pages(): ApiResponse | undefined {
        // Every page read so far with `more`, its items in one list
        return oApi.get(`${sState}/pages`);
      },
      pagesQuery(): QueryParams {
        // The page size and the order chosen by the user, without the page
        return { limit, orderBy: app.get(`${sState}/orderBy`) };
      },
      async goTo(iPage: number): Promise<ApiResponse> {
        // Moves to a page, never before the first one, and reads it
        app.set(`${sState}/page`, Math.max(iPage, 0));
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
        // Toggles the order of the field and starts the pages again
        const sDirection = app.get(`${sState}/orderBy`)?.[sField] === 'asc' ? 'desc' : 'asc';
        app.set(`${sState}/orderBy`, { [sField]: sDirection });
        oApi.set(`${sState}/pages`, undefined);

        // Reads the first page
        return this.goTo(0);
      },
    };
  });
}
