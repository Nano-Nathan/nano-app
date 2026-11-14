import { DEFAULT_STORE, REQUEST_FAILED } from '@nano-app/core/const';
import { IS_SERVER, PROXY_PATH } from '../const';
import Store from './Store';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiError } from '../types/store';

/** Backend of an `api` store through the proxy: one method per HTTP method, as its routes */
export default class ApiStore extends Store {
  /** URL of the store in the proxy: `/api` for the default one, `/api/<store>` for the rest */
  private readonly sUrl: string;
  private iCount = 0;

  /** Store of the backend `API_<NAME>_URL`, with the initial data of its file */
  constructor(sName: string, oData?: NanoObject) {
    super(oData);
    this.sUrl = sName === DEFAULT_STORE ? PROXY_PATH : `${PROXY_PATH}/${sName}`;
  }

  /** Answer of a read, kept at its path and query */
  public get(sPath: string, oQuery?: QueryParams): any {
    return super.get(ApiStore.key(sPath, oQuery));
  }

  /** `GET <path>`, kept at its path */
  public GET(sPath: string): Promise<ApiResponse> {
    return this.send('GET', sPath);
  }

  /** `QUERY <path>` with the query as its body, kept at its path and query */
  public QUERY(sPath: string, oQuery: QueryParams): Promise<ApiResponse> {
    return this.send('QUERY', sPath, oQuery);
  }

  /** `POST <path>` */
  public POST(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.send('POST', sPath, oBody);
  }

  /** `PUT <path>` */
  public PUT(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.send('PUT', sPath, oBody);
  }

  /** `DELETE <path>` */
  public DELETE(sPath: string): Promise<ApiResponse> {
    return this.send('DELETE', sPath);
  }

  /** Sends a request: `/busy` while it is out, its answer as an `ApiResponse`, a failure in `/error/list` */
  private async send(sMethod: string, sPath: string, oBody?: unknown): Promise<ApiResponse> {
    // Asks nothing on the server
    if (IS_SERVER) return {};

    // Sets the store busy while the request is out
    this.set('/busy', ++this.iCount > 0);

    // Reads the answer as an `ApiResponse`, with its HTTP status
    let oResponse: ApiResponse = { success: false, message: REQUEST_FAILED };
    let sText: string | undefined;
    try {
      const oRes = await fetch(`${this.sUrl}${sPath}`, {
        method: sMethod,
        body: JSON.stringify(oBody),
        headers: { 'content-type': 'application/json' },
      });
      sText = await oRes.text();
      oResponse = { ...JSON.parse(sText), status: oRes.status };
    } catch {
      // Keeps the text of an answer that is not JSON
      if (sText !== undefined) oResponse = { ...oResponse, result: sText };
    }

    // Sets the store not busy when no request is left
    this.set('/busy', --this.iCount > 0);

    // Keeps a failed answer with a message and the time, after the ones before
    if (!oResponse.success) {
      const oError: ApiError = {
        ...oResponse,
        message: oResponse.message || REQUEST_FAILED,
        timestamp: Date.now(),
      };
      this.set('/error/list', [...(this.get('/error/list') ?? []), oError]);
    }

    // Keeps the answer of a read at its path and query, over what was there
    if (sMethod === 'GET' || sMethod === 'QUERY') {
      const sKey = ApiStore.key(sPath, oBody);
      this.set(sKey, { ...super.get(sKey), ...oResponse });
    }
    return oResponse;
  }

  /** Key of a read: its path, with its query when it has one */
  private static key(sPath: string, oQuery?: unknown): string {
    return oQuery ? `${sPath}?${JSON.stringify(oQuery)}` : sPath;
  }
}
