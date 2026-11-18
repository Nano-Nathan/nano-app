import type { ReactNode } from 'react';

/** A link of the navbar: where it leads, its text and its icon */
export type ShellLink = {
  /** Path it leads to (`/accounts`) */
  href: string;
  /** Key of its text (`home.title`) */
  label: string;
  /** Icon before the text, alone while the navbar is closed (`<IconHome />`) */
  icon: ReactNode;
};

/** The user of the session the navbar shows */
export type ShellUser = {
  /** Name, and its initials without an image */
  name: string;
  /** Email */
  email: string;
  /** Photo of its provider (Google's), when it has one */
  image?: string | null;
};

/** Options of `createShell`: the title and the logo of the header, the links of the navbar and the login */
export type ShellOptions = {
  /** Title of the header */
  title: string;
  /** Path of the image before the title (`/icon.png`) */
  logo?: string;
  /** Links of the navbar, in order */
  links: ShellLink[];
  /** Path without a session and after signing out, `/login` by default */
  login?: string;
};
