import type { ApiResponse } from '@nano-app/core/types/api';

/** Options of `auth` */
export type AuthOptions = {
  /** Better Auth method of `signIn` and `signUp` (`'email'` by default) */
  kind?: string;
  /** Name of the api store with `auth` (`api` by default) */
  store?: string;
};

/** Methods an `auth` gives its view; the session is read from `/session` of its api store */
export type AuthMethods = {
  /** Signs in with the body Better Auth asks for its `kind` */
  signIn(body: unknown): Promise<ApiResponse | undefined>;
  /** Signs up with the body Better Auth asks for its `kind` */
  signUp(body: unknown): Promise<ApiResponse | undefined>;
  /** Signs out */
  signOut(): Promise<ApiResponse | undefined>;
  /** Reads the session into `/session` */
  load(): Promise<ApiResponse | undefined>;
  /** Goes to a url of the app */
  navTo(url: string): void;
};
