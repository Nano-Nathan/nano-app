import LoginController from '@nano-app/controllers/login';
import NanoError from '@nano-app/core/utils/NanoError';
import type { ApiStore } from '@nano-app/frontend';
import type { ModeTexts } from '../../types/login';

/** The login of the page: its store and home from the props, and the texts of its mode */
export default class LoginPageController extends LoginController {
  protected api: ApiStore = this.store();
  protected home: string = this.props.home;

  /** Texts of the current mode */
  public mode(): ModeTexts {
    const { texts } = this.props;
    const oSignIn = { submit: texts.submit, question: texts.noAccount, link: texts.register };
    const oSignUp = { submit: texts.register, question: texts.haveAccount, link: texts.submit };
    return this.isSignUp() ? oSignUp : oSignIn;
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
