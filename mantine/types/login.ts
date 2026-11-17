/** Texts of the login page */
export type LoginTexts = {
  /** Title of the card */
  title: string;
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
};

/** Options of `createLoginPage`: the api store with Better Auth, where to go after it, and its texts */
export type LoginOptions = {
  /** Name of the api store whose backend has Better Auth */
  store: string;
  /** Path the page goes to once signed in or signed up */
  home: string;
  /** Texts that replace the English ones */
  texts?: Partial<LoginTexts>;
};
