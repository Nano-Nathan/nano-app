import { IS_SERVER } from '@nano-app/core/const';
import ApiStore from './ApiStore';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Api store of a backend with Better Auth: signs in and out, and keeps the session */
export default class AuthStore extends ApiStore {
  private sBasePath: string;
  private oSession?: ApiResponse;

  /** Store of the backend `API_<NAME>_URL`, with Better Auth at its base path */
  constructor(sName: string, sBasePath: string, oData?: NanoObject) {
    super(sName, oData);
    this.sBasePath = sBasePath;
  }

  /** `POST <basePath>/sign-in/<kind>` (`email`...), reading the session again on success */
  public signIn(sKind: string, oBody: unknown): Promise<ApiResponse> {
    return this.post(`/sign-in/${sKind}`, oBody);
  }

  /** `POST <basePath>/sign-up/<kind>`, reading the session again on success */
  public signUp(sKind: string, oBody: unknown): Promise<ApiResponse> {
    return this.post(`/sign-up/${sKind}`, oBody);
  }

  /** `POST <basePath>/sign-out`, reading the session again on success */
  public signOut(): Promise<ApiResponse> {
    return this.post('/sign-out', {});
  }

  /** `GET <basePath>/get-session` into `/session`, kept until the next sign-in, -up or -out */
  public async readSession(): Promise<ApiResponse> {
    // Asks nothing on the server
    if (IS_SERVER) return {};

    // Returns the kept answer
    if (this.oSession) return this.oSession;

    // Asks the backend and keeps its answer, and its `{ user, session }` in `/session`
    const oResponse = await this.request(`${this.sBasePath}/get-session`, { method: 'GET' });
    this.oSession = oResponse;
    this.set('/session', oResponse.result ?? null);
    return oResponse;
  }

  /** Better Auth's answer inside an `ApiResponse`; a 401 of the backend clears the session */
  protected receive(sPath: string, oRes: Response, oBody: ApiResponse): ApiResponse {
    // Clears the session and its kept answer on a 401
    if (oRes.status === 401) {
      this.oSession = undefined;
      this.set('/session', null);
    }

    // Answers of the backend's own routes are already an `ApiResponse`
    if (!sPath.startsWith(`${this.sBasePath}/`)) return oBody;

    // Wraps the answer of Better Auth, with its message
    return { success: oRes.ok, result: oBody, message: oBody?.message };
  }

  /** Sends a `POST` to Better Auth and, on success, reads the session again */
  private async post(sPath: string, oBody: unknown): Promise<ApiResponse> {
    // Sends it
    const oResponse = await this.request(`${this.sBasePath}${sPath}`, {
      method: 'POST',
      body: JSON.stringify(oBody),
    });

    // Returns a failed answer as is
    if (!oResponse.success) return oResponse;

    // Reads the session again
    this.oSession = undefined;
    await this.readSession();
    return oResponse;
  }
}
