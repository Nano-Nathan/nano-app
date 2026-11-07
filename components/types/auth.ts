/** Options of `auth` */
export type AuthOptions = {
  /** Better Auth method of `signIn` and `signUp` (`'email'` by default) */
  kind?: string;
  /** Name of the api store with `auth` (`api` by default) */
  store?: string;
};
