import { createAuthClient } from 'better-auth/client';
import { IS_SERVER } from '@nano-app/core/const';
import ApiStore from './ApiStore';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Api store of a backend with Better Auth: its client in `auth`, and its session kept in `/session` */
export default class AuthStore extends ApiStore {
  /** Better Auth's client through the proxy of the store; only in the browser */
  public auth?: ReturnType<typeof createAuthClient>;

  /** Store of the backend `API_<NAME>_URL`, with Better Auth at its base path */
  constructor(sName: string, sBasePath: string, oData?: NanoObject) {
    super(sName, oData);

    // The server renders without a session
    if (IS_SERVER) return;

    // Creates the client: its requests count in `/busy` and its failed answers go to `/error/list`
    const oAuth = createAuthClient({
      baseURL: `${location.origin}/api/${sName}${sBasePath}`,
      fetchOptions: {
        customFetchImpl: (oInput, oInit) => this.track(fetch(oInput, oInit)),
        onError: ({ error }) => this.fail({ success: false, message: error.message }),
        // The client reads the session again after the email kind; the others need this
        onSuccess: ({ request }) => {
          if (/\/sign-(in|up)\/(?!email$)/.test(String(request.url))) {
            oAuth.$store.notify('$sessionSignal');
          }
        },
      },
    });
    this.auth = oAuth;

    // Keeps the session in `/session`: read now, and again after each sign-in, sign-up and sign-out
    oAuth.useSession.subscribe(({ data }) => this.set('/session', data));
  }

  /** A 401 of the backend reads the session again: it is over */
  protected receive(oRes: Response, oBody: ApiResponse): ApiResponse {
    if (oRes.status === 401) this.auth?.$store.notify('$sessionSignal');
    return oBody;
  }
}
