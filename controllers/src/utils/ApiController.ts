import AppController from './AppController';
import type { ApiStore } from '@nano-app/frontend';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';

/** Controller that requests an api store, `api` by default, besides its state in `app` */
export default class ApiController extends AppController {
  /** Api store it requests: `api` by default, another one from a subclass (`protected api = this.stores.admin;`) */
  protected api: ApiStore = this.stores.api;

  /** `api.GET` */
  protected GET(sPath: string): Promise<ApiResponse> {
    return this.api.GET(sPath);
  }

  /** `api.QUERY` */
  protected QUERY(sPath: string, oQuery: QueryParams): Promise<ApiResponse> {
    return this.api.QUERY(sPath, oQuery);
  }

  /** `api.POST` */
  protected POST(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.api.POST(sPath, oBody);
  }

  /** `api.PUT` */
  protected PUT(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.api.PUT(sPath, oBody);
  }

  /** `api.DELETE` */
  protected DELETE(sPath: string): Promise<ApiResponse> {
    return this.api.DELETE(sPath);
  }
}
