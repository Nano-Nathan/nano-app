import { QueryClient } from '@tanstack/query-core';
import { IS_SERVER, REQUEST_FAILED } from '@nano-app/core/const';
import Pages from './Pages';
import Store from './Store';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiError } from '../types/store';

/** Backend of an `api` store through its proxy; each read keeps its `ApiResponse` in the store */
export default class ApiStore extends Store {
  private sName: string;
  private iCount = 0;

  /** Pages of each path and query read with `more`, by their key */
  private oPages: NanoObject<Pages> = {};

  /** Cache of the reads: each one is kept until a write on its path or a parent */
  protected oClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity } },
  });

  /** Store of the backend `API_<NAME>_URL`, with the initial data of its file */
  constructor(sName: string, oData?: NanoObject) {
    super(oData);
    this.sName = sName;
  }

  /** Value at a path, with the query of the read that kept it */
  // any: the value is the consumer's, unknown to the framework
  public get(sPath: string, oQuery?: QueryParams): any {
    // Gets the value at the key of the path and query
    return super.get(ApiStore.key(sPath, oQuery));
  }

  /** `ApiResponse` of a path and query, from the cache until a write on its path or a parent */
  public async read(sPath: string, oQuery?: QueryParams): Promise<ApiResponse> {
    // Asks nothing on the server
    if (IS_SERVER) return {};

    // Answers from the cache, or asks the backend once for every concurrent read
    const oInit = oQuery ? { method: 'QUERY', body: JSON.stringify(oQuery) } : { method: 'GET' };
    const oResponse = await this.oClient.fetchQuery({
      queryKey: oQuery ? [sPath, oQuery] : [sPath],
      queryFn: () => this.request(sPath, oInit),
    });

    // Keeps it for the views
    this.keep(oResponse, ApiStore.key(sPath, oQuery));
    return oResponse;
  }

  /** Every page of a path and query read so far, adding the next one on each call */
  public async more(sPath: string, oQuery: QueryParams): Promise<ApiResponse> {
    // Asks nothing on the server
    if (IS_SERVER) return {};

    // Reads the next page, or the first one
    await this.pages(sPath, oQuery).next();
    return this.get(sPath, oQuery);
  }

  /** A view shows the pages of a path and query: old ones are read again now and after each write */
  public watch(sPath: string, oQuery: QueryParams): void {
    // Counts one more view of the pages
    this.pages(sPath, oQuery).watch();
  }

  /** A view no longer shows the pages of a path and query */
  public unwatch(sPath: string, oQuery: QueryParams): void {
    // Counts one view less of the pages
    this.pages(sPath, oQuery).unwatch();
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
    this.oClient.setQueryData([sPath], oResponse);
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

    // Once answered, cancels the reads out, marks them old and reads again the pages a view shows
    for (const sParent of ApiStore.parents(sPath)) {
      await this.oClient.cancelQueries({ queryKey: [sParent] });
      await this.oClient.invalidateQueries({ queryKey: [sParent] });
    }
    return oResponse;
  }

  /** Sends a request, keeping `/busy` while it is out and a failed answer in `/error/list` */
  protected request(sPath: string, oInit: RequestInit): Promise<ApiResponse> {
    return this.track(this.send(sPath, oInit));
  }

  /** Counts a request while it is out: `/busy` is true until none is left */
  protected track<T>(oRequest: Promise<T>): Promise<T> {
    // Counts the request and sets the store busy
    this.iCount++;
    this.set('/busy', true);

    // Sets the store not busy when no request is left
    return oRequest.finally(() => {
      this.iCount--;
      this.set('/busy', this.iCount > 0);
    });
  }

  /** Adds a failed answer to the errors of the store, with when it failed */
  protected fail(oResponse: ApiResponse): void {
    // Keeps it with a message and the time, after the ones before
    const oError: ApiError = {
      ...oResponse,
      message: oResponse.message || REQUEST_FAILED,
      timestamp: Date.now(),
    };
    this.set('/error/list', [...(this.get('/error/list') ?? []), oError]);
  }

  /** `ApiResponse` of an answer of the proxy, from its JSON */
  protected receive(_oRes: Response, oResponse: ApiResponse): ApiResponse {
    return oResponse;
  }

  /** Sends a request to the proxy of the store and reads its answer as an `ApiResponse` */
  private async send(sPath: string, oInit: RequestInit): Promise<ApiResponse> {
    let sText: string | undefined;
    let oResponse: ApiResponse = { success: false, message: REQUEST_FAILED };
    try {
      const oRes = await fetch(`/api/${this.sName}${sPath}`, {
        ...oInit,
        headers: { 'content-type': 'application/json' },
      });
      sText = await oRes.text();
      oResponse = this.receive(oRes, JSON.parse(sText));
    } catch {
      // Keeps the text of an answer that is not JSON as the result of the failed `ApiResponse`
      if (sText !== undefined) oResponse = { ...oResponse, result: sText };
    }

    // Adds a failed answer to the errors of the store
    if (!oResponse.success) this.fail(oResponse);
    return oResponse;
  }

  /** Pages of a path and query, created on first use, each one read with its `offset` */
  private pages(sPath: string, oQuery: QueryParams): Pages {
    // Creates them once, kept at the key of the path and query
    const sKey = ApiStore.key(sPath, oQuery);
    this.oPages[sKey] ??= new Pages(this.oClient, {
      key: [sPath, oQuery, 'more'],
      limit: oQuery.limit,
      read: iOffset =>
        this.request(sPath, {
          method: 'QUERY',
          body: JSON.stringify({ ...oQuery, offset: iOffset }),
        }),
      keep: oResponse => this.keep(oResponse, sKey),
    });
    return this.oPages[sKey];
  }

  /** Keeps an answer at the key of its path and query for the views, over what was there */
  private keep(oResponse: ApiResponse, sKey: string): void {
    // Sets the answer merged over the value at its key
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
