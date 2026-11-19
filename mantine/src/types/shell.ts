import type { ReactNode } from 'react';

/** A link of the navbar: where it leads, its text and its icon */
export type ShellLink = {
  /** Path it leads to (`/accounts`) */
  href: string;
  /** Key of its text (`home.title`) */
  label: string;
  /** Icon before the text, alone while the navbar is closed (`<IconHome />`) */
  icon: ReactNode;
  /** Roles of the session's user that see it (`['admin']`); every user without them */
  roles?: string[];
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

/** Items of the framework in the navbar, each on or off */
export type ShellItems = {
  /** The user of the session, its photo, name and email; on by default */
  user?: boolean;
  /** Switch of the color scheme; on by default */
  theme?: boolean;
  /** Sign-out; on by default */
  logout?: boolean;
};

/** Options of `createShell`: the title and the logo of the header, the links of the navbar and the login */
export type ShellOptions = {
  /** Title of the header */
  title: string;
  /** Path of the image before the title (`/icon.png`) */
  logo?: string;
  /** Links of the app in the navbar, in order */
  links?: ShellLink[];
  /** Items of the framework, on or off */
  items?: ShellItems;
  /** Path without a session and after signing out, `/login` by default */
  login?: string;
};
