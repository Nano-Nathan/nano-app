import { z } from 'zod';
import type { FormField } from '@nano-app/controllers';

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

/** Sizes of the shell, as in Mantine's docs (AppShell, NavbarMinimal): a number is rem scaled by the theme; the rail centers an icon behind the paddings of the navbar and the link */
export const SHELL_SIZES = {
  header: 60,
  navbar: 300,
  rail: 80,
};

/** Fade of the texts of the navbar, with the transition of AppShell */
const SHELL_FADE = {
  transition:
    'opacity var(--app-shell-transition-duration) var(--app-shell-transition-timing-function)',
};

/** Texts of the navbar: shown while open, faded out while closed, as its width changes */
export const SHELL_TEXT = {
  open: SHELL_FADE,
  closed: { ...SHELL_FADE, opacity: 0 },
};
