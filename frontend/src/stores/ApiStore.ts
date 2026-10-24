import { observable, runInAction } from 'mobx';
import { IS_SERVER } from '@nano-app/core/const';
import Store from './Store';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiCache } from '../types/store';

/**
 * Backend data of an `api` store, through its proxy (`/api/<name>/...`), by path and query.
 * Its own state (`get`/`set`) is the one of a `Store`; what it read stays apart.
 */
export default class ApiStore extends Store {
  private sName: string;
  private oCache: ApiCache = observable({ iBusy: 0, oResults: {}, oVersions: {} });
  private oRead: NanoObject<number> = {};

  /** Store of the backend `API_<NAME>_URL`, with the initial data of its file */
  constructor(sName: string, oData?: NanoObject) {
    super(oData);
    this.sName = sName;
  }

  /** Requests in progress */
  public get busy(): number {
    return this.oCache.iBusy;
  }

  /** Result at a path: from local, asked to the backend when never read or its entity changed */
  // any: the result is the consumer's, unknown to the framework
  public read(sPath: string, oQuery?: QueryParams): any {
    // Asks nothing on the server: the proxy is reached from the browser, which reads on hydrating
    if (IS_SERVER) return undefined;

    // Finds the key of the path and query, and the version of its entity
    const sKey = oQuery ? `${sPath}?${JSON.stringify(oQuery)}` : sPath;
    const iVersion = this.oCache.oVersions[ApiStore.entity(sPath)] ?? 0;

    // Asks the backend once per version: the version is kept when the request leaves
    if (this.oRead[sKey] !== iVersion) {
      this.oRead[sKey] = iVersion;
      const oInit = oQuery ? { method: 'QUERY', body: JSON.stringify(oQuery) } : { method: 'GET' };

      // Starts after the render that asked for it: requesting changes observable state
      queueMicrotask(() =>
        this.request(sPath, oInit).then(oResponse =>
          runInAction(() => (this.oCache.oResults[sKey] = oResponse.result)),
        ),
      );
    }

    return this.oCache.oResults[sKey];
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

  /** Sends a write and changes the version of its entity when the answer comes back */
  private write(sMethod: string, sPath: string, oBody?: unknown): Promise<ApiResponse> {
    // Raises the version of the entity once the answer is back, so its reads ask again
    return this.request(sPath, { method: sMethod, body: JSON.stringify(oBody) }).finally(() =>
      runInAction(() => {
        const sEntity = ApiStore.entity(sPath);
        this.oCache.oVersions[sEntity] = (this.oCache.oVersions[sEntity] ?? 0) + 1;
      }),
    );
  }

  /** Sends a request to the proxy and returns its JSON answer, counting it as busy */
  private async request(sPath: string, oInit: RequestInit): Promise<ApiResponse> {
    // Counts the request while it is in progress
    runInAction(() => this.oCache.iBusy++);
    try {
      // Sends it to the proxy of the store and reads its JSON
      const oRes = await fetch(`/api/${this.sName}${sPath}`, {
        ...oInit,
        headers: { 'content-type': 'application/json' },
      });
      return await oRes.json();
    } finally {
      runInAction(() => this.oCache.iBusy--);
    }
  }

  /** Entity of a path: its first segment (`/users/7` → `/users`) */
  private static entity(sPath: string): string {
    return `/${sPath.split('/').filter(Boolean)[0] ?? ''}`;
  }
}
