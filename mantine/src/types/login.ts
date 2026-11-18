/** Social providers of Better Auth the login offers */
export type LoginProvider = 'google';

/** Options of `createLoginPage`: where to go once in, the providers and the sign-up; its texts are `nano.login` of the messages */
export type LoginOptions = {
  /** Path the page goes to once signed in or signed up */
  home: string;
  /** Social providers, each with its button, configured in the backend's Better Auth */
  providers?: LoginProvider[];
  /** Whether the card offers to sign up (`true` by default); `false` when only an admin creates users */
  signUp?: boolean;
};
