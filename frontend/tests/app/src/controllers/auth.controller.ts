import { AuthController } from '@nano-app/controllers';

/** Session of the backend store, shared by the login and the sign-out */
export default class BackendAuthController extends AuthController {
  protected api = this.stores.backend;

  /** Signs in with the values of the form and goes to the private page */
  public async login(oValues: unknown): Promise<void> {
    const oResponse = await this.signIn(oValues);
    if (oResponse.success) this.navTo('/private');
  }

  /** Signs out and goes to the login */
  public async logout(): Promise<void> {
    const oResponse = await this.signOut();
    if (oResponse.success) this.navTo('/login');
  }
}
