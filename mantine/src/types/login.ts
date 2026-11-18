/** Texts of the login page */
export type LoginTexts = {
  /** Title of the card */
  title: string;
  /** Line under the title */
  subtitle: string;
  /** Line between the providers and the email */
  divider: string;
  /** Question before the link that signs up */
  noAccount: string;
  /** Question before the link that goes back to sign in */
  haveAccount: string;
  /** Label of the email */
  email: string;
  /** Label of the password */
  password: string;
  /** Button that signs in */
  submit: string;
  /** Button that signs up with the same values */
  register: string;
  /** Error of an invalid email */
  invalidEmail: string;
  /** Error of a missing value */
  required: string;
  /** Button that signs in with Google */
  google: string;
};

/** Social providers of Better Auth the login offers */
export type LoginProvider = 'google';

/** Options of `createLoginPage`: where to go once in, the providers, the sign-up and its texts */
export type LoginOptions = {
  /** Path the page goes to once signed in or signed up */
  home: string;
  /** Social providers, each with its button, configured in the backend's Better Auth */
  providers?: LoginProvider[];
  /** Whether the card offers to sign up (`true` by default); `false` when only an admin creates users */
  signUp?: boolean;
  /** Texts that replace the English ones */
  texts?: Partial<LoginTexts>;
};
