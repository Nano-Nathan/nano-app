import AppController from './AppController';
import type { ApiStore } from '@nano-app/frontend';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';

/** Controller that requests an api store, `api` by default, besides its state in `app` */
export default class ApiController extends AppController {
  /** Api store it requests: `api` by default, another one from a subclass (`protected api = this.stores.admin;`) */
  protected api: ApiStore = this.stores.api;

  /** Whether a request of this controller is out: of its whole `api` store without `root` */
  public isBusy(): boolean {
    return (this.api.get(`${this.root}/requests`) ?? 0) > 0;
  }

  /** Counts a request at `<root>/requests` of `api` while it is out; `api` counts its own at `/requests` */
  private async request(fnSend: () => Promise<ApiResponse>): Promise<ApiResponse> {
    // Without a root its store's count is its own
    if (!this.root) return fnSend();

    // One more request out, one less once it answers
    const sPath = `${this.root}/requests`;
    this.api.set(sPath, (this.api.get(sPath) ?? 0) + 1);
    const oResponse = await fnSend();
    this.api.set(sPath, this.api.get(sPath) - 1);
    return oResponse;
  }

  /** `api.GET` */
  protected GET(sPath: string): Promise<ApiResponse> {
    return this.request(() => this.api.GET(sPath));
  }

  /** `api.QUERY` */
  protected QUERY(sPath: string, oQuery: QueryParams): Promise<ApiResponse> {
    return this.request(() => this.api.QUERY(sPath, oQuery));
  }

  /** `api.POST` */
  protected POST(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.request(() => this.api.POST(sPath, oBody));
  }

  /** `api.PUT` */
  protected PUT(sPath: string, oBody: unknown): Promise<ApiResponse> {
    return this.request(() => this.api.PUT(sPath, oBody));
  }

  /** `api.DELETE` */
  protected DELETE(sPath: string): Promise<ApiResponse> {
    return this.request(() => this.api.DELETE(sPath));
  }
}
