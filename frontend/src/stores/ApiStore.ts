import { observable, runInAction } from 'mobx';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiState } from '../types/store';

/** Backend data of one `api` store, through the proxy (`/api/<name>/...`), cached per path and query */
export default class ApiStore {
  private sName: string;
  private oState: ApiState = observable({ iBusy: 0, oResults: {}, oVersions: {} });
  private oPending = new Set<string>();

  /** Store of the backend `API_<NAME>_URL` */
  constructor(sName: string) {
    this.sName = sName;
  }

  /** Requests in progress */
  public get busy(): number {
    return this.oState.iBusy;
  }

  /** Result at a path: from local, and asked to the backend when never read or its entity changed */
  // any: the result is the consumer's, unknown to the framework
  public read(sPath: string, oQuery?: QueryParams): any {
    // Finds the result of the path and query, and the version of its entity
    const sKey = oQuery ? `${sPath}?${JSON.stringify(oQuery)}` : sPath;
    const oResult = this.oState.oResults[sKey];
    const iVersion = this.oState.oVersions[ApiStore.entity(sPath)] ?? 0;

    // Asks the backend once when the result is missing or older than its entity
    if (oResult?.iVersion !== iVersion && !this.oPending.has(sKey)) {
      this.load(sKey, sPath, oQuery, iVersion);
    }

    return oResult?.result;
  }

  /** `POST <path>` */
  public create(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.write('POST', sPath, oBody);
  }

  /** `PUT <path>/<id>` */
  public update(sPath: string, sId: string | number, oBody: unknown): Promise<ApiResponse> {
    return this.write('PUT', `${sPath}/${sId}`, oBody);
  }

  /** `DELETE <path>/<id>` */
  public delete(sPath: string, sId: string | number): Promise<ApiResponse> {
    return this.write('DELETE', `${sPath}/${sId}`);
  }

  /** Reads a path from the backend and keeps it with the version it left with */
  private load(
    sKey: string,
    sPath: string,
    oQuery: QueryParams | undefined,
    iVersion: number,
  ): void {
    // Marks it now, so the reads of the same render ask once
    this.oPending.add(sKey);

    // Starts after the render that asked for it: requesting changes observable state
    queueMicrotask(() => {
      const oInit = oQuery ? { method: 'QUERY', body: JSON.stringify(oQuery) } : { method: 'GET' };

      // Keeps the result, or what there was on a failure: it is not asked again until a write
      const fnKeep = (oResponse?: ApiResponse): void =>
        runInAction(() => {
          const oPrevious = this.oState.oResults[sKey];
          const result = oResponse?.success ? oResponse.result : oPrevious?.result;
          this.oState.oResults[sKey] = { iVersion, result };
        });

      this.request(sPath, oInit)
        .then(fnKeep, () => fnKeep())
        .finally(() => this.oPending.delete(sKey));
    });
  }

  /** Sends a write and changes the version of its entity when the answer comes back */
  private write(sMethod: string, sPath: string, oBody?: unknown): Promise<ApiResponse> {
    return this.request(sPath, { method: sMethod, body: JSON.stringify(oBody) }).finally(() =>
      runInAction(() => {
        const sEntity = ApiStore.entity(sPath);
        this.oState.oVersions[sEntity] = (this.oState.oVersions[sEntity] ?? 0) + 1;
      }),
    );
  }

  /** Sends a request to the proxy and returns its JSON answer, counting it as busy */
  private async request(sPath: string, oInit: RequestInit): Promise<ApiResponse> {
    // Counts the request while it is in progress
    runInAction(() => this.oState.iBusy++);
    try {
      const sUrl = `/api/${this.sName}${sPath}`;
      const oRes = await fetch(sUrl, { ...oInit, headers: { 'content-type': 'application/json' } });

      // Only a JSON answer is an ApiResponse
      if (!oRes.headers.get('content-type')?.includes('application/json')) {
        throw new Error(
          `[nano-app] [ERROR] ${oInit.method} ${sUrl} answered ${oRes.status} without JSON.`,
        );
      }

      return await oRes.json();
    } finally {
      runInAction(() => this.oState.iBusy--);
    }
  }

  /** Entity of a path: its first segment (`/users/7` → `/users`) */
  private static entity(sPath: string): string {
    return `/${sPath.split('/').filter(Boolean)[0] ?? ''}`;
  }
}
