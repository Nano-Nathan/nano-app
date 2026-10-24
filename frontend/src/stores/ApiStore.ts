import { runInAction } from 'mobx';
import { IS_SERVER } from '@nano-app/core/const';
import Store from './Store';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';

/**
 * Backend of an `api` store, through its proxy (`/api/<name>/...`). Each read keeps its
 * `ApiResponse` in the store at its path and query, so the views get it with `get`.
 */
export default class ApiStore extends Store {
  private sName: string;
  private oVersions: NanoObject<number> = {};
  private iCount = 0;

  /** Store of the backend `API_<NAME>_URL`, with the initial data of its file */
  constructor(sName: string, oData?: NanoObject) {
    super(oData);
    this.sName = sName;
  }

  /** `ApiResponse` a read kept for that path and query, or the value at a path of the state */
  // any: the value is the consumer's, unknown to the framework
  public get(sPath: string, oQuery?: QueryParams): any {
    // A read is kept as one key (`/users/7`), apart from the levels of the state
    return this.oState[ApiStore.key(sPath, oQuery)] ?? super.get(sPath);
  }

  /** `ApiResponse` of a path and query: from the store while its entity did not change */
  public async read(sPath: string, oQuery?: QueryParams): Promise<ApiResponse | undefined> {
    // Asks nothing on the server: the proxy is reached from the browser
    if (IS_SERVER) return;

    // Answers from the store when it kept this read and its entity was not written since
    const sEntity = ApiStore.entity(sPath);
    const oKept = this.get(sPath, oQuery);
    if (oKept && this.oVersions[sEntity] === 1) return oKept;

    // Marks the entity as read when the request leaves: a write while it is out marks it again
    this.oVersions[sEntity] = 1;
    const oInit = oQuery ? { method: 'QUERY', body: JSON.stringify(oQuery) } : { method: 'GET' };
    const oResponse = await this.request(sPath, oInit);

    // Keeps the answer as one key of the state: its path and query
    runInAction(() => (this.oState[ApiStore.key(sPath, oQuery)] = oResponse));
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

  /** Sends a write and marks its entity as changed, so its next reads ask the backend */
  private async write(sMethod: string, sPath: string, oBody?: unknown): Promise<ApiResponse> {
    // Sends it, and marks its entity once the answer is back
    const oResponse = await this.request(sPath, { method: sMethod, body: JSON.stringify(oBody) });
    this.oVersions[ApiStore.entity(sPath)] = 0;
    return oResponse;
  }

  /** Sends a request to the proxy and returns its JSON answer, keeping `/busy` while it is out */
  private async request(sPath: string, oInit: RequestInit): Promise<ApiResponse> {
    // Counts the request and marks the store busy
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
      // Stops being busy when no request is left
      this.iCount--;
      this.set('/busy', this.iCount > 0);
    }
  }

  /** Key of a read in the store: its path, with its query when it has one */
  private static key(sPath: string, oQuery?: QueryParams): string {
    return oQuery ? `${sPath}?${JSON.stringify(oQuery)}` : sPath;
  }

  /** Entity of a path: its first segment (`/users/7` → `/users`) */
  private static entity(sPath: string): string {
    return `/${sPath.split('/').filter(Boolean)[0] ?? ''}`;
  }
}
