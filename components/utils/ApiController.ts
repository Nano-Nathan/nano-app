import AppController from './AppController';
import type { ApiStore } from '@nano-app/frontend';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';

/** Controller that requests the api store its subclass gives, besides its state in `app` */
export default abstract class ApiController extends AppController {
  /** Api store it requests (`protected api = this.stores.backend;`) */
  protected abstract api: ApiStore;

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
