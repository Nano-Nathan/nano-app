import type { NanoObject } from '@nano-app/core/types/objects';

/** Values of a login form: the email and the password, and any other field it has */
export type LoginValues = NanoObject & {
  email: string;
  password: string;
};
