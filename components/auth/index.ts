import { AUTH_PATH } from '@nano-app/core/const';
import ApiController from '../utils/ApiController';
import type { ApiResponse } from '@nano-app/core/types/api';

/** Sign-in, sign-up and sign-out of an api store with Better Auth, and the navigation after them */
export default class AuthController extends ApiController {
  /** Better Auth method of `signIn` and `signUp` (`email` by default) */
  public kind = 'email';

  /** Better Auth's sign-in of the kind */
  public signIn(oBody: unknown): Promise<ApiResponse> {
    return this.api().POST(`${AUTH_PATH}/sign-in/${this.kind}`, oBody);
  }

  /** Better Auth's sign-up of the kind */
  public signUp(oBody: unknown): Promise<ApiResponse> {
    return this.api().POST(`${AUTH_PATH}/sign-up/${this.kind}`, oBody);
  }

  /** Better Auth's sign-out */
  public signOut(): Promise<ApiResponse> {
    return this.api().POST(`${AUTH_PATH}/sign-out`, {});
  }

  /** Goes to a url of the app */
  public navTo(sUrl: string): void {
    this.router.push(sUrl);
  }
}
