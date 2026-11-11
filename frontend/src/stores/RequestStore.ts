import { REQUEST_FAILED } from '@nano-app/core/const';
import Store from './Store';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ApiError } from '../types/store';

/** Requests of a store through the proxy, with its `/busy` and `/error/list` */
export default class RequestStore extends Store {
  private sName: string;
  private iCount = 0;

  /** Store of the backend `API_<NAME>_URL`, with the initial data of its file */
  constructor(sName: string, oData?: NanoObject) {
    super(oData);
    this.sName = sName;
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
      // Keeps the text of an answer that is not JSON
      if (sText !== undefined) oResponse = { ...oResponse, result: sText };
    }

    // Adds a failed answer to the errors of the store
    if (!oResponse.success) this.fail(oResponse);
    return oResponse;
  }
}
