import { AUTH_PATH } from '@nano-app/core/const';
import ApiController from '../utils/ApiController';
import type { ApiResponse } from '@nano-app/core/types/api';

/** Sign-in, sign-up and sign-out of an api store with Better Auth, and the navigation after them */
export default class AuthController extends ApiController {
  /** Better Auth method of `signIn` and `signUp` (`email` by default) */
  protected kind = 'email';

  /** Better Auth's sign-in of a kind, `kind` by default */
  public signIn(oBody: unknown, sKind: string = this.kind): Promise<ApiResponse> {
    return this.POST(`${AUTH_PATH}/sign-in/${sKind}`, oBody);
  }

  /** Better Auth's sign-up of a kind, `kind` by default */
  public signUp(oBody: unknown, sKind: string = this.kind): Promise<ApiResponse> {
    return this.POST(`${AUTH_PATH}/sign-up/${sKind}`, oBody);
  }

  /** Better Auth's sign-out */
  public signOut(): Promise<ApiResponse> {
    return this.POST(`${AUTH_PATH}/sign-out`, {});
  }

  /** Goes to a url of the app */
  public navTo(sUrl: string): void {
    this.router.push(sUrl);
  }
}
