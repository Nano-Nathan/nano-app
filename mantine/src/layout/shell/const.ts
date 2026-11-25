import { rem } from '@mantine/core';
import { heading } from '../../const';

/** Sizes of the shell, as in Mantine's docs (AppShell): a number is rem scaled by the theme; the rail centers the box of a row (ThemeIcon `md`) behind the border and padding of the card and the padding of the link */
export const SHELL_SIZES = {
  navbar: 300,
  rail: 74,
};

/** Styles of AppShell: the ground of the app behind it, and a navbar that animates its width */
export const SHELL_STYLES = {
  navbar: { background: 'transparent', transitionProperty: 'transform, width', overflow: 'hidden' },
};

/** Rounded corners of a link of the navbar */
export const SHELL_LINK = { borderRadius: 'var(--mantine-radius-md)' };

/** Label of a row of the navbar: a block, so its line height alone sets the height of its text */
export const SHELL_LABEL = { display: 'block' };

/** Label of the brand of the navbar: the title of the app, at the level of a brand in the headings' scale */
export const SHELL_BRAND = { ...SHELL_LABEL, ...heading('brand') };

/** A row of the navbar that is not a link: no hover nor pointer */
export const SHELL_STATIC = { background: 'transparent', cursor: 'default' };

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

/** Items of the framework in the navbar, all on */
export const SHELL_ITEMS = { user: true, theme: true, logout: true };

/** Space between the links of the navbar: half the theme's smallest spacing */
export const SHELL_GAP = 'calc(var(--mantine-spacing-xs) / 2)';

/** Pull of a card of the shell over its neighbor by the width of a border, so where two cards meet one line shows */
export const SHELL_SEAM = `calc(-1 * ${rem(1)})`;

/** The card of the page: it scrolls what does not fit in it */
export const SHELL_CONTENT = { overflow: 'auto' };
