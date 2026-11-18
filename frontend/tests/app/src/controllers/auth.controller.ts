import { AuthController } from '@nano-app/controllers';

/** Session of the backend store, shared by the login and the sign-out */
export default class BackendAuthController extends AuthController {
  protected api = this.stores.backend;
  protected home = '/private';

  /** Signs out and goes to the login */
  public async logout(): Promise<void> {
    const oResponse = await this.signOut();
    if (oResponse.success) this.router.push('/login');
  }
}
