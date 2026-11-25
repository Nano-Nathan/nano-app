import { z } from 'zod';
import type { FormField } from '@nano-app/controllers';

/** Values of the look an app can change: each one reads the CSS variable `--nano-<name>` (set by the app, as in its `cssVariablesResolver`), else this default */
export const TOKENS = {
  /** Strength of the primary color in the glows of the ground */
  tint: '20%',
  /** How far the glows of the ground reach from their corners */
  glow: '50%',
  /** Strength of the body over the ground in a glass card and a dialog */
  veil: '70%',
  /** Strength of the primary color on borders and lines */
  border: '40%',
  /** Strength of the text's color on a row of a table */
  row: '5%',
  /** Strength of the primary color on a row under hover or focus */
  'row-hover': '14%',
  /** Space between the rows of a table */
  'row-gap': 'calc(var(--mantine-spacing-xs) / 2)',
  /** Time a row takes to change its color */
  'row-motion': '120ms',
  /** Strength of the text's color on a placeholder, on light */
  placeholder: '55%',
  /** Space between the letters of a title */
  'heading-spacing': '-0.02em',
  /** Room above the content of a dialog */
  'dialog-room': 'var(--mantine-spacing-xl)',
  /** Room below the content of a dialog, more as its last field has no label under it */
  'dialog-room-below': 'calc(var(--mantine-spacing-xl) * 1.5)',
};

/** The value of a token: its CSS variable, else its default */
export function token(sName: keyof typeof TOKENS): string {
  return `var(--nano-${sName}, ${TOKENS[sName]})`;
}

/** Level of the title of each kind of thing, in the headings' scale: every title takes the size of its level */
export const HEADINGS = {
  page: 2,
  modal: 3,
  drawer: 3,
  brand: 3,
  column: 5,
  notification: 5,
} as const;

/** A title of any kind: the text's color in the font and weight of the theme's headings, its letters a little closer; `Title` takes its size from its `order` */
export const HEADING = {
  fontFamily: 'var(--mantine-font-family-headings)',
  fontWeight: 'var(--mantine-heading-font-weight)',
  letterSpacing: token('heading-spacing'),
};

/** The style of the title of a kind of thing, at the size of its level */
export function heading(sKind: keyof typeof HEADINGS): typeof HEADING & { fontSize: string } {
  return { ...HEADING, fontSize: `var(--mantine-h${HEADINGS[sKind]}-font-size)` };
}

/** Class names the theme gives to Mantine's components and its rules (`NANO_CSS`) read */
export const NANO_CLASSES = { table: 'nano-table' };

/** CSS variable of the count of columns of a table: `DataTable` sets it, the grid of the table reads it */
export const COLUMNS_VAR = '--nano-columns';

/** The theme's primary color, faint: the ground of the app and the 404 behind its texts */
export const PRIMARY_TINT = `color-mix(in srgb, var(--mantine-primary-color-filled) ${token('tint')}, transparent)`;

/** The theme's primary color for texts and icons: its light color on light, its shade 4 on dark, where Mantine's is almost white */
export const PRIMARY_TEXT =
  'light-dark(var(--mantine-primary-color-light-color), var(--mantine-primary-color-4))';

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
    validation: z.email('nano.form.invalidEmail'),
  },
  {
    name: 'password',
    label: 'nano.login.password',
    type: 'password',
    validation: z.string('nano.form.required'),
  },
];
