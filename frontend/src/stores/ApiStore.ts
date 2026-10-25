import { IS_SERVER, REQUEST_FAILED } from '@nano-app/core/const';
import Store from './Store';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Backend of an `api` store through its proxy; each read keeps its `ApiResponse` in the store */
export default class ApiStore extends Store {
  private sName: string;
  private oVersions: NanoObject<number> = {};
  private oKept: NanoObject<number> = {};
  private iCount = 0;

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

  /** `ApiResponse` of a path and query, from the store while it was kept at its path's version */
  public async read(sPath: string, oQuery?: QueryParams): Promise<ApiResponse> {
    // Asks nothing on the server
    if (IS_SERVER) return {};

    // Returns the kept answer while it was kept at the current version of its path
    const sKey = ApiStore.key(sPath, oQuery);
    const iVersion = this.oVersions[sPath] ?? 0;
    if (this.oKept[sKey] === iVersion) return this.get(sPath, oQuery);

    // Asks the backend
    const oInit = oQuery ? { method: 'QUERY', body: JSON.stringify(oQuery) } : { method: 'GET' };
    const oResponse = await this.request(sPath, oInit);

    // Returns the answer without keeping it when a write changed its path meanwhile
    if ((this.oVersions[sPath] ?? 0) !== iVersion) return oResponse;

    // Keeps the answer at its path and query, with the version of its path
    this.keep(oResponse, sPath, oQuery);
    return oResponse;
  }

  /** `POST <path>` */
  public create(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.write('POST', sPath, oBody);
  }

  /** `PUT <path>`, keeping a successful answer at its path with its new version */
  public async update(sPath: string, oBody: unknown): Promise<ApiResponse> {
    // Sends the write
    const oResponse = await this.write('PUT', sPath, oBody);

    // Returns a failed answer as is
    if (!oResponse.success) return oResponse;

    // Keeps the answer at its path
    this.keep(oResponse, sPath);
    return oResponse;
  }

  /** `DELETE <path>` */
  public delete(sPath: string): Promise<ApiResponse> {
    return this.write('DELETE', sPath);
  }

  /** Sends a write and raises the version of its path and its parents */
  private async write(sMethod: string, sPath: string, oBody?: unknown): Promise<ApiResponse> {
    // Sends it, and raises the versions once the answer is back
    const oResponse = await this.request(sPath, { method: sMethod, body: JSON.stringify(oBody) });
    for (const sParent of ApiStore.parents(sPath)) {
      this.oVersions[sParent] = (this.oVersions[sParent] ?? 0) + 1;
    }
    return oResponse;
  }

  /** Sends a request, keeping `/busy` while it is out and a failed answer in `/error/list` */
  private async request(sPath: string, oInit: RequestInit): Promise<ApiResponse> {
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
      oResponse = JSON.parse(sText);
    } catch {
      // Keeps the text of an answer that is not JSON as the result of the failed `ApiResponse`
      if (sText !== undefined) oResponse = { ...oResponse, result: sText };
    }

    // Adds a failed answer to the errors of the store
    if (!oResponse.success) {
      const oError = { ...oResponse, message: oResponse.message || REQUEST_FAILED };
      this.set('/error/list', [...(this.get('/error/list') ?? []), oError]);
    }

    // Sets the store not busy when no request is left
    this.iCount--;
    this.set('/busy', this.iCount > 0);
    return oResponse;
  }

  /** Keeps an answer at its path and query, over what was there, with its path's version */
  private keep(oResponse: ApiResponse, sPath: string, oQuery?: QueryParams): void {
    // Sets the answer merged over the value at its key, and the version it was kept with
    const sKey = ApiStore.key(sPath, oQuery);
    this.set(sKey, { ...this.get(sPath, oQuery), ...oResponse });
    this.oKept[sKey] = this.oVersions[sPath] ?? 0;
  }

  /** A path and each of its parents */
  private static parents(sPath: string): string[] {
    // Joins the keys of the path up to each level
    const aKeys = sPath.split('/').filter(Boolean);
    return aKeys.map((_sKey, iIndex) => `/${aKeys.slice(0, iIndex + 1).join('/')}`);
  }

  /** Key of a read: its path, with its query when it has one */
  private static key(sPath: string, oQuery?: QueryParams): string {
    return oQuery ? `${sPath}?${JSON.stringify(oQuery)}` : sPath;
  }
}
