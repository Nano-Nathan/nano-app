import NanoError from '@nano-app/core/utils/NanoError';
import AuthController from './Auth.controller';
import type { ApiStore } from '@nano-app/frontend';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { LoginValues } from '../types/login';

/** A login: signs in or signs up by its mode, or with a provider, and goes to `home`; `store` and `home` come in its props */
export default class LoginController extends AuthController {
  /** Path of its state */
  protected root = '/login';
  /** Api store with Better Auth, named by the prop `store` */
  protected api: ApiStore = this.store();
  /** Path the login goes to once signed in or signed up, the prop `home` */
  protected home: string = this.props.home;

  /** Whether it signs up instead of signing in */
  public isSignUp(): boolean {
    return this.get('/isSignUp') ?? false;
  }

  /** Switches between signing in and signing up */
  public toggle(): void {
    this.set('/isSignUp', !this.isSignUp());
  }

  /** Whether a request of its api store is out */
  public isBusy(): boolean {
    return this.api.get('/busy') ?? false;
  }

  /** Signs in, or signs up with the email as the name, by its mode, and goes to `home` */
  public async send(oValues: LoginValues): Promise<void> {
    const oResponse = this.isSignUp()
      ? await this.signUp({ ...oValues, name: oValues.email })
      : await this.signIn(oValues);
    if (oResponse.success) this.navTo(this.home);
  }

  /** Signs in with a provider of Better Auth: its page, then back to `home` */
  public async social(sProvider: string): Promise<void> {
    // Asks Better Auth the provider's page, back to home
    const { success, url }: ApiResponse & { url?: string } = await this.signIn(
      { provider: sProvider, callbackURL: this.home },
      'social',
    );

    // Goes to the provider's page, outside the app
    if (success && url) window.location.assign(url);
  }

  /** The api store named by the prop `store`; fails when the app has none of that name */
  private store(): ApiStore {
    const { store } = this.props;
    const oStore: ApiStore | undefined = Reflect.get(this.stores, store);
    if (!oStore)
      throw new NanoError(
        `The login asks the store "${store}", which the app does not have. Add src/stores/${store}.store.ts with type 'api'.`,
      );
    return oStore;
  }
}
