import { createAuthClient } from 'better-auth/client';
import { IS_SERVER } from '@nano-app/core/const';
import ApiStore from './ApiStore';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Api store of a backend with Better Auth: signs in and out with its client, and keeps the session */
export default class AuthStore extends ApiStore {
  /** Better Auth's client through the proxy of the store; only in the browser */
  private oAuth?: ReturnType<typeof createAuthClient>;

  /** Store of the backend `API_<NAME>_URL`, with Better Auth at its base path */
  constructor(sName: string, sBasePath: string, oData?: NanoObject) {
    super(sName, oData);

    // The server renders without a session
    if (IS_SERVER) return;

    // Creates the client: its requests count in `/busy`, and a sign-in, -up or -out of any kind reads the session again
    const oAuth = createAuthClient({
      baseURL: `${location.origin}/api/${sName}${sBasePath}`,
      fetchOptions: {
        customFetchImpl: (oInput, oInit) => this.track(fetch(oInput, oInit)),
        onSuccess: ({ request }) => {
          if (/\/sign-(in|up|out)/.test(String(request.url))) oAuth.$store.notify('$sessionSignal');
        },
      },
    });
    this.oAuth = oAuth;

    // Keeps the session of the client in `/session`: read now, and again when it changes
    oAuth.useSession.subscribe(({ data }) => this.set('/session', data));
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

  /** A 401 of the backend reads the session again: it is over */
  protected receive(oRes: Response, oBody: ApiResponse): ApiResponse {
    // Asks the client for the session again
    if (oRes.status === 401) this.oAuth?.$store.notify('$sessionSignal');
    return oBody;
  }

  /** Sends a `POST` with Better Auth's client and wraps its answer in an `ApiResponse` */
  private async post(sPath: string, oBody: unknown): Promise<ApiResponse> {
    // Asks nothing on the server
    if (!this.oAuth) return {};

    // Sends it; a failed answer goes to the errors of the store with Better Auth's message
    const { data, error } = await this.oAuth.$fetch(sPath, { method: 'POST', body: oBody });
    const oResponse = { success: !error, result: data, message: error?.message };
    if (error) this.fail(oResponse);
    return oResponse;
  }
}
