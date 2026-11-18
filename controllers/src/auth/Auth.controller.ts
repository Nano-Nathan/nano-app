import { AUTH_PATH } from '@nano-app/core/const';
import ApiController from '../utils/ApiController';
import type { ApiMessage } from '@nano-app/frontend';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { LoginValues } from '../types/login';

/** Better Auth of the api store: sign-in (email or a provider), sign-up and sign-out, and where they lead */
export default class AuthController extends ApiController {
  /** Path of its state: its flag is on while it signs up instead of signing in */
  protected root = '/auth';
  /** Better Auth method of `signIn` and `signUp` (`email` by default) */
  protected kind = 'email';
  /** Path it goes to once signed in or signed up: the prop `home`, `/` by default */
  protected home: string = this.props.home ?? '/';

  /** Shows the error a provider came back with (`?error=signup_disabled`) as a message of `api` */
  public onMount(): void {
    // Nothing to show without an error in the url
    const sError = new URLSearchParams(location.search).get('error');
    if (!sError) return;

    // Its key among the messages of the api store, and the url without it
    const oMessage: ApiMessage = {
      success: false,
      message: `nano.auth.${sError}`,
      type: 'error',
      timestamp: Date.now(),
    };
    this.api.set('/message/list', [...(this.api.get('/message/list') ?? []), oMessage]);
    this.router.replace(location.pathname);
  }

  /** Better Auth's sign-in of a kind (`social` with a `provider`), then where it leads */
  public signIn(oBody: NanoObject, sKind: string = this.kind): Promise<ApiResponse> {
    return this.enter(`${AUTH_PATH}/sign-in/${sKind}`, oBody);
  }

  /** Better Auth's sign-up of a kind, then where it leads */
  public signUp(oBody: NanoObject, sKind: string = this.kind): Promise<ApiResponse> {
    return this.enter(`${AUTH_PATH}/sign-up/${sKind}`, oBody);
  }

  /** Sends the body, coming back from a provider to `home`, or to this page on an error, and goes where a success leads */
  private async enter(sPath: string, oBody: NanoObject): Promise<ApiResponse> {
    // Sends it with the pages a provider comes back to
    const oResponse = await this.POST(sPath, {
      ...oBody,
      callbackURL: this.home,
      errorCallbackURL: location.pathname,
    });

    // A provider's page (its `url`), or home
    if (oResponse.success) this.router.push(oResponse.result?.url ?? this.home);
    return oResponse;
  }

  /** Better Auth's sign-out */
  public signOut(): Promise<ApiResponse> {
    return this.POST(`${AUTH_PATH}/sign-out`, {});
  }

  /** Signs in, or signs up while its flag is on, the email as the name unless the values bring one */
  public send(oValues: LoginValues): Promise<ApiResponse> {
    return this.isToggled()
      ? this.signUp({ name: oValues.email, ...oValues })
      : this.signIn(oValues);
  }
}
