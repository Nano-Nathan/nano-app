import { QueryClient } from '@tanstack/query-core';
import { IS_SERVER, REQUEST_FAILED } from '@nano-app/core/const';
import Optimistic from './Optimistic';
import Pages from './Pages';
import Store from './Store';
import type { InfiniteData, QueryKey } from '@tanstack/query-core';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiError, WriteOptions } from '../types/store';

/** Backend of an `api` store through its proxy; each read keeps its `ApiResponse` in the store */
export default class ApiStore extends Store {
  private sName: string;
  private iCount = 0;

  /** Pages of each path and query read with `more`, by their key */
  private oPages: NanoObject<Pages> = {};

  /** Cache of the reads: each one is kept until a write on its path or a parent */
  protected oClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

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

    // Creates the pages of the path and query on the first call, each one read with its `skip`
    const sKey = ApiStore.key(sPath, oQuery);
    this.oPages[sKey] ??= new Pages(this.oClient, {
      key: [sPath, oQuery, 'more'],
      top: oQuery.top,
      read: iSkip =>
        this.request(sPath, { method: 'QUERY', body: JSON.stringify({ ...oQuery, skip: iSkip }) }),
      keep: oResponse => this.keep(oResponse, sKey),
    });

    // Reads the next page, or the first one
    await this.oPages[sKey].next();
    return this.get(sPath, oQuery);
  }

  /** `POST <path>` */
  public create(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.write('POST', sPath, oBody);
  }

  /** `PUT <path>`, keeping a successful answer at its path; optimistic, shown before it */
  public async update(
    sPath: string,
    oBody: unknown,
    oOptions?: WriteOptions,
  ): Promise<ApiResponse> {
    // Shows the body at its path and in the lists of its parent before the answer
    const fnUndo = oOptions?.optimistic ? this.show(sPath, oBody) : undefined;

    // Sends the write
    const oResponse = await this.write('PUT', sPath, oBody);

    // Undoes what it showed and returns a failed answer as is
    if (!oResponse.success) {
      fnUndo?.();
      return oResponse;
    }

    // Keeps the answer at its path, in the cache and for the views
    this.oClient.setQueryData([sPath], oResponse);
    this.keep(oResponse, sPath);
    return oResponse;
  }

  /** `DELETE <path>`; optimistic, its item leaves the lists of its parent before the answer */
  public async delete(sPath: string, oOptions?: WriteOptions): Promise<ApiResponse> {
    // Leaves its item out of the lists of its parent before the answer
    const fnUndo = oOptions?.optimistic ? this.show(sPath) : undefined;

    // Sends the write, and undoes what it showed when it fails
    const oResponse = await this.write('DELETE', sPath);
    if (!oResponse.success) fnUndo?.();
    return oResponse;
  }

  /** Sends a write, and cancels and invalidates the reads of its path and its parents */
  private async write(sMethod: string, sPath: string, oBody?: unknown): Promise<ApiResponse> {
    // Sends it
    const oResponse = await this.request(sPath, { method: sMethod, body: JSON.stringify(oBody) });

    // Once answered, cancels the reads out, marks the kept ones to ask again, reads the pages again
    for (const sParent of ApiStore.parents(sPath)) {
      await this.oClient.cancelQueries({ queryKey: [sParent] });
      await this.oClient.invalidateQueries({ queryKey: [sParent] });
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

  /** Shows a write at its path and in its parent's lists before the answer; returns its undo */
  private show(sPath: string, oItem?: unknown): () => void {
    // Takes the reads kept of the path and of its parent
    const sId = sPath.split('/').at(-1) ?? '';
    const aReads = ApiStore.parents(sPath)
      .slice(-2)
      .flatMap(sKey =>
        this.oClient.getQueriesData<ApiResponse | InfiniteData<ApiResponse>>({ queryKey: [sKey] }),
      );

    // Shows each one with the item, or without it
    for (const [oKey, oData] of aReads) {
      if (oData) this.cache(oKey, Optimistic.apply(oData, sId, oItem));
    }

    // Puts back what each one had
    return () => {
      for (const [oKey, oData] of aReads) this.cache(oKey, oData);
    };
  }

  /** Writes a read in the cache, and at its path and query for the views; pages keep themselves */
  private cache(oKey: QueryKey, oData?: ApiResponse | InfiniteData<ApiResponse>): void {
    // Writes it in the cache
    this.oClient.setQueryData(oKey, oData);

    // Keeps a read, not pages, for the views
    if (!oData || 'pages' in oData) return;
    this.keep(oData, ApiStore.key(String(oKey[0]), oKey[1]));
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
