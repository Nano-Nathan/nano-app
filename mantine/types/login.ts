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

/** Options of `createLoginPage`: the api store with Better Auth, where to go after it, and its texts */
export type LoginOptions = {
  /** Name of the api store whose backend has Better Auth */
  store: string;
  /** Path the page goes to once signed in or signed up */
  home: string;
  /** Social providers, each with its button, configured in the backend's Better Auth */
  providers?: LoginProvider[];
  /** Texts that replace the English ones */
  texts?: Partial<LoginTexts>;
};
