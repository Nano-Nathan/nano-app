import { z } from 'zod';
import type { FormField } from '@nano-app/controllers';

/** The theme's primary color, faint: the ground of the app and the 404 behind its texts */
export const PRIMARY_TINT =
  'color-mix(in srgb, var(--mantine-primary-color-filled) 20%, transparent)';

/** The theme's primary color for texts and icons, in each color scheme */
export const PRIMARY_TEXT = 'var(--mantine-primary-color-light-color)';

/** Mantine color of each kind of notification */
export const NOTIFICATION_COLORS = {
  success: 'green',
  error: 'red',
  info: 'blue',
  warning: 'yellow',
};

/** Key of each text of a login mode: its button, and the question and link to the other mode */
export const LOGIN_MODES = {
  signIn: { submit: 'submit', question: 'noAccount', link: 'register' },
  signUp: { submit: 'register', question: 'haveAccount', link: 'submit' },
} as const;

/** Fields of the login: the email and the password, their labels and messages keys of the texts */
export const LOGIN_FIELDS: FormField[] = [
  {
    name: 'email',
    label: 'nano.login.email',
    type: 'email',
    validation: z.email('nano.login.invalidEmail'),
  },
  {
    name: 'password',
    label: 'nano.login.password',
    type: 'password',
    validation: z.string('nano.login.required'),
  },
];
