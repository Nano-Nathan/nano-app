import AuthController from '@nano-app/components/auth';
import NanoError from '@nano-app/core/utils/NanoError';
import type { ApiStore } from '@nano-app/frontend';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { LoginProvider, LoginValues, ModeTexts } from '../../types/login';

/** Auth of the store of the props: signs in or signs up and goes to the home */
export default class LoginController extends AuthController {
  protected api: ApiStore = this.store();

  /** Whether the card signs up instead of signing in */
  public isSignUp(): boolean {
    return this.stores.app.get('/login/isSignUp') ?? false;
  }

  /** Switches the card between signing in and signing up */
  public toggle(): void {
    this.stores.app.set('/login/isSignUp', !this.isSignUp());
  }

  /** Texts of the current mode */
  public mode(): ModeTexts {
    const { texts } = this.props;
    const oSignIn = { submit: texts.submit, question: texts.noAccount, link: texts.register };
    const oSignUp = { submit: texts.register, question: texts.haveAccount, link: texts.submit };
    return this.isSignUp() ? oSignUp : oSignIn;
  }

  /** Signs in or signs up with the valid values of the form, by the mode */
  public send(oValues: LoginValues): Promise<void> {
    return this.isSignUp() ? this.register(oValues) : this.login(oValues);
  }

  /** Signs in with the values of the form and goes to the home */
  public async login(oValues: LoginValues): Promise<void> {
    const oResponse = await this.signIn(oValues);
    if (oResponse.success) this.navTo(this.props.home);
  }

  /** Signs up with the values of the form, the email as the name, and goes to the home */
  public async register(oValues: LoginValues): Promise<void> {
    const oResponse = await this.signUp({ ...oValues, name: oValues.email });
    if (oResponse.success) this.navTo(this.props.home);
  }

  /** Signs in with a provider: its page, then back to the home */
  public async social(sProvider: LoginProvider): Promise<void> {
    // Asks Better Auth the provider's page, back to the home
    const { success, url }: ApiResponse & { url?: string } = await this.signIn(
      { provider: sProvider, callbackURL: this.props.home },
      'social',
    );

    // Goes to the provider's page, outside the app
    if (success && url) window.location.assign(url);
  }

  /** The api store of the props; fails when the app has none of that name */
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
