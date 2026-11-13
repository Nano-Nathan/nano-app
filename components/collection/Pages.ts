import { InfiniteQueryObserver } from '@tanstack/query-core';
import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/query-core';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiStore } from '@nano-app/frontend';
import type { QueryParams } from '@nano-app/core/types/api';
import type { PagesConfig } from '../types/collection';

/** Pages of a list read one after another, from `offset` 0, kept in one answer for the views */
export default class Pages {
  /** Pages of each store, by their path and query: one per list, whatever view shows it */
  private static oAll = new WeakMap<ApiStore, NanoObject<Pages>>();

  private fnKeep: PagesConfig['keep'];
  private iViews = 0;
  private fnStop?: () => void;
  private oObserver: InfiniteQueryObserver<
    ApiResponse,
    Error,
    InfiniteData<ApiResponse, number>,
    QueryKey,
    number
  >;

  /** Pages of a key of the cache, each one read by `read(offset)` and all of them kept by `keep` */
  constructor(oClient: QueryClient, oConfig: PagesConfig) {
    const { key, limit = 0, read, keep } = oConfig;
    this.fnKeep = keep;

    // Reads each page from its `offset`, until one is not full
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
      // Read again on their own only once a page was read, when a view shows them old
      enabled: oQuery => oQuery.state.data !== undefined,
      getNextPageParam: (oLast, aPages) => {
        const isFull = limit > 0 && oLast.result?.length === limit;
        return isFull ? aPages.length * limit : undefined;
      },
    });
  }

  /** Pages of a path and query of a store, created on first use, each one read with its `offset` */
  public static of(oApi: ApiStore, sPath: string, oQuery: QueryParams): Pages {
    // The pages of the store, kept while it lives
    const oPages = Pages.oAll.get(oApi) ?? {};
    Pages.oAll.set(oApi, oPages);

    // Creates them once, read and kept at the path and query
    const sKey = JSON.stringify([sPath, oQuery]);
    oPages[sKey] ??= new Pages(oApi.client, {
      key: [sPath, oQuery, 'more'],
      limit: oQuery.limit,
      read: offset => oApi.read(sPath, { ...oQuery, offset }),
      keep: oResponse => oApi.keep(oResponse, sPath, oQuery),
    });
    return oPages[sKey];
  }

  /** Reads the next page, or the first one, and keeps them */
  public async next(): Promise<void> {
    const { data } = await this.oObserver.fetchNextPage();
    this.keep(data);
  }

  /** A view shows the pages: while one does, a write reads them again; old ones read again now */
  public watch(): void {
    // Listens to the pages from the first view on
    if (this.iViews++ > 0) return;
    this.fnStop = this.oObserver.subscribe(({ data }) => this.keep(data));
  }

  /** A view no longer shows the pages: with none left, a write only marks them old */
  public unwatch(): void {
    // Stops listening when the last view goes
    if (--this.iViews > 0) return;
    this.fnStop?.();
  }

  /** Keeps every page read in one answer, its items in order */
  private keep(oData?: InfiniteData<ApiResponse, number>): void {
    // Keeps nothing before the first page
    if (!oData) return;
    const aItems = oData.pages.flatMap(oPage => oPage.result ?? []);
    this.fnKeep({ ...oData.pages.at(-1), result: aItems });
  }
}
