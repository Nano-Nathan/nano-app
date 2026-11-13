import { QueryClient } from '@tanstack/query-core';
import { IS_SERVER } from '../const';
import RequestStore from './RequestStore';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';

/** Backend of an `api` store through its proxy; each read keeps its `ApiResponse` in the store */
export default class ApiStore extends RequestStore {
  /** Cache of the reads: each one is kept until a write on its path or a parent */
  public readonly client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity } },
  });

  /** Value at a path, with the query of the read that kept it */
  public get(sPath: string, oQuery?: QueryParams): any {
    // Gets the value at the key of the path and query
    return super.get(ApiStore.key(sPath, oQuery));
  }

  /** `ApiResponse` of a path and query, from the cache until a write on its path or a parent */
  public async read(sPath: string, oQuery?: QueryParams): Promise<ApiResponse> {
    // Asks nothing on the server
    if (IS_SERVER) return {};

    // Answers from the cache, or asks the backend once for every concurrent read
    const { queryKey, init } = oQuery
      ? { queryKey: [sPath, oQuery], init: { method: 'QUERY', body: JSON.stringify(oQuery) } }
      : { queryKey: [sPath], init: { method: 'GET' } };
    const oResponse = await this.client.fetchQuery({
      queryKey,
      queryFn: () => this.request(sPath, init),
    });

    // Keeps it for the views
    this.keep(oResponse, sPath, oQuery);
    return oResponse;
  }

  /** `POST <path>` */
  public create(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.write('POST', sPath, oBody);
  }

  /** `PUT <path>`, keeping a successful answer at its path */
  public async update(sPath: string, oBody: unknown): Promise<ApiResponse> {
    // Sends the write
    const oResponse = await this.write('PUT', sPath, oBody);

    // Returns a failed answer as is
    if (!oResponse.success) return oResponse;

    // Keeps the answer at its path, in the cache and for the views
    this.client.setQueryData([sPath], oResponse);
    this.keep(oResponse, sPath);
    return oResponse;
  }

  /** `DELETE <path>` */
  public delete(sPath: string): Promise<ApiResponse> {
    return this.write('DELETE', sPath);
  }

  /** Sends a write, and cancels and invalidates the reads of its path and its parents */
  private async write(sMethod: string, sPath: string, oBody?: unknown): Promise<ApiResponse> {
    // Sends it
    const oResponse = await this.request(sPath, { method: sMethod, body: JSON.stringify(oBody) });

    // Cancels the reads out and marks them old
    for (const sParent of ApiStore.parents(sPath)) {
      await this.client.cancelQueries({ queryKey: [sParent] });
      await this.client.invalidateQueries({ queryKey: [sParent] });
    }
    return oResponse;
  }

  /** Keeps an answer at its path and query for the views, over what was there */
  public keep(oResponse: ApiResponse, sPath: string, oQuery?: QueryParams): void {
    // Sets the answer merged over the value at its key
    const sKey = ApiStore.key(sPath, oQuery);
    this.set(sKey, { ...super.get(sKey), ...oResponse });
  }

  /** A path and each of its parents */
  private static parents(sPath: string): string[] {
    // Joins the keys of the path up to each level
    const aKeys = sPath.split('/').filter(Boolean);
    return aKeys.map((_sKey, iIndex) => `/${aKeys.slice(0, iIndex + 1).join('/')}`);
  }

  /** Key of a read: its path, with its query when it has one */
  private static key(sPath: string, oQuery?: unknown): string {
    return oQuery ? `${sPath}?${JSON.stringify(oQuery)}` : sPath;
  }
}
