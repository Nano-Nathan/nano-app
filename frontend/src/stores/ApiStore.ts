import { IS_SERVER } from '@nano-app/core/const';
import Store from './Store';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Backend of an `api` store through its proxy; each read keeps its `ApiResponse` in the store */
export default class ApiStore extends Store {
  private sName: string;
  private oVersions: NanoObject<number> = {};
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

  /** `ApiResponse` of a path and query, from the store while its path is at version 1 */
  public async read(sPath: string, oQuery?: QueryParams): Promise<ApiResponse> {
    // Asks nothing on the server
    if (IS_SERVER) return {};

    // Returns the kept answer while its path is at version 1
    const oKept = this.get(sPath, oQuery);
    if (oKept && this.oVersions[sPath] === 1) return oKept;

    // Sets the path to version 1 and asks the backend
    this.oVersions[sPath] = 1;
    const oInit = oQuery ? { method: 'QUERY', body: JSON.stringify(oQuery) } : { method: 'GET' };
    const oResponse = await this.request(sPath, oInit);

    // Keeps the answer at its path and query, over what the store had there
    this.set(ApiStore.key(sPath, oQuery), { ...this.get(sPath, oQuery), ...oResponse });
    return oResponse;
  }

  /** `POST <path>` */
  public create(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.write('POST', sPath, oBody);
  }

  /** `PUT <path>` */
  public update(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.write('PUT', sPath, oBody);
  }

  /** `DELETE <path>` */
  public delete(sPath: string): Promise<ApiResponse> {
    return this.write('DELETE', sPath);
  }

  /** Sends a write and sets its path and its parents to version 0 */
  private async write(sMethod: string, sPath: string, oBody?: unknown): Promise<ApiResponse> {
    // Sends it, and sets the path and its parents to version 0 once the answer is back
    const oResponse = await this.request(sPath, { method: sMethod, body: JSON.stringify(oBody) });
    for (const sParent of ApiStore.parents(sPath)) this.oVersions[sParent] = 0;
    return oResponse;
  }

  /** Sends a request to the proxy and returns its JSON answer, keeping `/busy` while it is out */
  private async request(sPath: string, oInit: RequestInit): Promise<ApiResponse> {
    // Counts the request and sets the store busy
    this.iCount++;
    this.set('/busy', true);
    try {
      // Sends it to the proxy of the store and reads its JSON
      const oRes = await fetch(`/api/${this.sName}${sPath}`, {
        ...oInit,
        headers: { 'content-type': 'application/json' },
      });
      return await oRes.json();
    } finally {
      // Sets the store not busy when no request is left
      this.iCount--;
      this.set('/busy', this.iCount > 0);
    }
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
