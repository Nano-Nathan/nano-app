import { AUTH_PATH } from '@nano-app/core/const';
import ApiController from '../utils/ApiController';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { LoginValues } from '../types/login';

/** Better Auth of the api store: sign-in, sign-up by a mode, a provider and sign-out, and where they lead */
export default class AuthController extends ApiController {
  /** Path of its state */
  protected root = '/auth';
  /** Better Auth method of `signIn` and `signUp` (`email` by default) */
  protected kind = 'email';
  /** Path it goes to once signed in or signed up: the prop `home`, `/` by default */
  protected home: string = this.props.home ?? '/';

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

  /** Whether it signs up instead of signing in */
  public isSignUp(): boolean {
    return this.get('/isSignUp') ?? false;
  }

  /** Switches between signing in and signing up */
  public toggle(): void {
    this.set('/isSignUp', !this.isSignUp());
  }

  /** Signs in, or signs up with the email as the name, by its mode, and goes to `home` */
  public async send(oValues: LoginValues): Promise<void> {
    const oResponse = this.isSignUp()
      ? await this.signUp({ ...oValues, name: oValues.email })
      : await this.signIn(oValues);
    this.follow(oResponse);
  }

  /** Signs in with a provider of Better Auth: its page, then back to `home` */
  public async social(sProvider: string): Promise<void> {
    this.follow(await this.signIn({ provider: sProvider, callbackURL: this.home }, 'social'));
  }

  /** Goes where a successful answer of Better Auth leads: its `url` (a provider's page), or `home` */
  private follow(oResponse: ApiResponse): void {
    if (oResponse.success) this.router.push(oResponse.result?.url ?? this.home);
  }
}
