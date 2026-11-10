import { QueryClient } from '@tanstack/query-core';
import { IS_SERVER, REQUEST_FAILED } from '@nano-app/core/const';
import Store from './Store';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiError } from '../types/store';

/** Backend of an `api` store through its proxy; each read keeps its `ApiResponse` in the store */
export default class ApiStore extends Store {
  private sName: string;
  private iCount = 0;

  /** Cache of the reads: each one is kept until a write on its path or a parent */
  protected oClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, staleTime: Infinity } },
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
    const oResponse = await this.oClient
      .fetchQuery({
        queryKey: ApiStore.queryKey(sPath, oQuery),
        queryFn: () => this.request(sPath, oInit),
      })
      // Reads again when a write on its path cancelled it: `request` itself never rejects
      .catch(() => this.read(sPath, oQuery));

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

    // Once the answer is back, cancels the reads out and marks the kept ones to ask again
    for (const sParent of ApiStore.parents(sPath)) {
      await this.oClient.cancelQueries({ queryKey: [sParent] });
      await this.oClient.invalidateQueries({ queryKey: [sParent], refetchType: 'none' });
    }
    return oResponse;
  }

  /** Sends a request, keeping `/busy` while it is out and a failed answer in `/error/list` */
  protected async request(sPath: string, oInit: RequestInit): Promise<ApiResponse> {
    // Counts the request and sets the store busy
    this.iCount++;
    this.set('/busy', true);

    // Sends it to the proxy of the store and reads its answer as an `ApiResponse`
    let sText: string | undefined;
    let oResponse: ApiResponse = { success: false, message: REQUEST_FAILED };
    try {
      const oRes = await fetch(`/api/${this.sName}${sPath}`, {
        ...oInit,
        headers: { 'content-type': 'application/json' },
      });
      sText = await oRes.text();
      oResponse = this.receive(sPath, oRes, JSON.parse(sText));
    } catch {
      // Keeps the text of an answer that is not JSON as the result of the failed `ApiResponse`
      if (sText !== undefined) oResponse = { ...oResponse, result: sText };
    }

    // Adds a failed answer to the errors of the store
    if (!oResponse.success) {
      const oError: ApiError = {
        ...oResponse,
        message: oResponse.message || REQUEST_FAILED,
        timestamp: Date.now(),
      };
      this.set('/error/list', [...(this.get('/error/list') ?? []), oError]);
    }

    // Sets the store not busy when no request is left
    this.iCount--;
    this.set('/busy', this.iCount > 0);
    return oResponse;
  }

  /** `ApiResponse` of an answer of the proxy, from its JSON */
  protected receive(_sPath: string, _oRes: Response, oResponse: ApiResponse): ApiResponse {
    return oResponse;
  }

  /** Keeps an answer at its path and query for the views, over what was there */
  private keep(oResponse: ApiResponse, sPath: string, oQuery?: QueryParams): void {
    // Sets the answer merged over the value at its key
    const sKey = ApiStore.key(sPath, oQuery);
    this.set(sKey, { ...this.get(sPath, oQuery), ...oResponse });
  }

  /** A path and each of its parents */
  private static parents(sPath: string): string[] {
    // Joins the keys of the path up to each level
    const aKeys = sPath.split('/').filter(Boolean);
    return aKeys.map((_sKey, iIndex) => `/${aKeys.slice(0, iIndex + 1).join('/')}`);
  }

  /** Key of a read in the cache: its path, with its query when it has one */
  private static queryKey(sPath: string, oQuery?: QueryParams): unknown[] {
    return oQuery ? [sPath, oQuery] : [sPath];
  }

  /** Key of a read: its path, with its query when it has one */
  private static key(sPath: string, oQuery?: QueryParams): string {
    return oQuery ? `${sPath}?${JSON.stringify(oQuery)}` : sPath;
  }
}
