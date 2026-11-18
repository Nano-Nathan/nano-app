import type { FormField } from '@nano-app/controllers';

/** Social providers of Better Auth the login offers */
export type LoginProvider = 'google';

/** Options of `createLoginPage`: where to go once in, the providers and the sign-up; its texts are `nano.login` of the messages */
export type LoginOptions = {
  /** Path the page goes to once signed in or signed up, `/` by default */
  home?: string;
  /** Social providers, each with its button, configured in the backend's Better Auth */
  providers?: LoginProvider[];
  /** Whether the card offers to sign up (`true` by default); `false` when only an admin creates users */
  signUp?: boolean;
  /** Fields of the sign-in: `LOGIN_FIELDS` (email and password) by default */
  fields?: FormField[];
  /** Fields of the sign-up: `fields` by default; one beyond them (`phone`) needs `user.additionalFields` in the backend */
  signUpFields?: FormField[];
};
