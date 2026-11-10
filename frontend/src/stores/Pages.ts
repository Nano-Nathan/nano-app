import { InfiniteQueryObserver } from '@tanstack/query-core';
import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/query-core';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { PagesConfig } from '../types/store';

/** Pages of a list read one after another, from `skip` 0, kept in one answer on every change */
export default class Pages {
  private oObserver: InfiniteQueryObserver<
    ApiResponse,
    Error,
    InfiniteData<ApiResponse, number>,
    QueryKey,
    number
  >;

  /** Pages of a key of the cache, each one read by `read(skip)` and all of them kept by `keep` */
  constructor(oClient: QueryClient, oConfig: PagesConfig) {
    const { key, top = 0, read, keep } = oConfig;

    // Reads each page from its `skip`; a page with fewer than `top` items is the last one
    this.oObserver = new InfiniteQueryObserver<
      ApiResponse,
      Error,
      InfiniteData<ApiResponse, number>,
      QueryKey,
      number
    >(oClient, {
      queryKey: key,
      queryFn: ({ pageParam }) => read(pageParam),
      initialPageParam: 0,
      getNextPageParam: (oLast, aPages) => {
        const isFull = top > 0 && oLast.result?.length === top;
        return isFull ? aPages.length * top : undefined;
      },
    });

    // Keeps every page read in one answer, its items in order
    this.oObserver.subscribe(({ data }) => {
      if (!data) return;
      const aItems = data.pages.flatMap(oPage => oPage.result ?? []);
      keep({ ...data.pages.at(-1), result: aItems });
    });
  }

  /** Reads the next page, or the first one */
  public async next(): Promise<void> {
    await this.oObserver.fetchNextPage();
  }
}
