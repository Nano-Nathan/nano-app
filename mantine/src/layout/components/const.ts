import { rem } from '@mantine/core';
import { PRIMARY_TINT } from '../../const';
import type { MantineTheme, MantineThemeOverride } from '@mantine/core';

/** Ground of the app: the body with a glow of the primary color in two corners, fixed to the screen */
export const GROUND = {
  background: [
    `radial-gradient(circle at 0% 0%, ${PRIMARY_TINT}, transparent 50%)`,
    `radial-gradient(circle at 100% 100%, ${PRIMARY_TINT}, transparent 50%)`,
    'var(--mantine-color-body)',
  ].join(', '),
  backgroundAttachment: 'fixed',
};

/** Colors Mantine leaves under the contrast of WCAG (4.5:1): dimmed texts, and red buttons on light */
export const CONTRAST = {
  '--mantine-color-dimmed': 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-dark-1))',
  '--mantine-color-red-filled': 'var(--mantine-color-red-8)',
  '--mantine-color-red-filled-hover': 'var(--mantine-color-red-9)',
};

/** The primary color of the accents: the filled one on light, its shade 4 on dark, where the filled one is too dark to see */
const ACCENT = 'light-dark(var(--mantine-primary-color-filled), var(--mantine-primary-color-4))';

/** The accent faded to a part of itself (`40%`) over what is behind it */
function tint(sPart: string): string {
  return `color-mix(in srgb, ${ACCENT} ${sPart}, transparent)`;
}

/** The text color faded to a part of itself: a neutral tint that follows the scheme */
function shade(sPart: string): string {
  return `color-mix(in srgb, var(--mantine-color-text) ${sPart}, transparent)`;
}

/** Color of the borders and lines */
const BORDER = tint('40%');

/** A title of any kind (page, modal, column): the text's color in the font and weight of the theme's headings, its letters a little closer */
const HEADING = {
  fontFamily: 'var(--mantine-font-family-headings)',
  fontWeight: 'var(--mantine-heading-font-weight)',
  letterSpacing: '-0.02em',
};

/** A line of the border's color */
const LINE = `${rem(1)} solid ${BORDER}`;

/** The veil of a card of glass over the ground: the body at most of its strength */
const VEIL = 'color-mix(in srgb, var(--mantine-color-body) 70%, transparent)';

/** A card of glass: the ground blurred behind it, its border in the primary color */
const GLASS = {
  root: {
    '--paper-border-color': BORDER,
    background: VEIL,
    backdropFilter: 'blur(var(--mantine-spacing-md))',
  },
};

/** The cells at the two ends of a row of the body, which round its corners */
const ROW_ENDS = [
  '.nano-table tbody tr > :first-child { border-start-start-radius: var(--mantine-radius-md); border-end-start-radius: var(--mantine-radius-md); }',
  '.nano-table tbody tr > :last-child { border-start-end-radius: var(--mantine-radius-md); border-end-end-radius: var(--mantine-radius-md); }',
];

/** Rules the theme's inline styles cannot hold, for the class `nano-table`: a grid whose header, body and rows share its columns (`subgrid`, widths from the content), so only the body scrolls, under a line below the header; its rows a little apart as rounded bands of one neutral tint that take the accent on hover and focus */
export const NANO_CSS = [
  // The table: a column per field (`--nano-columns`), the header above the body, and the body as high as the space left
  '.nano-table { display: grid; grid-template-columns: repeat(var(--nano-columns), auto); grid-template-rows: auto minmax(0, 1fr); min-height: 0; }',
  '.nano-table thead, .nano-table tbody, .nano-table tr { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; }',
  // The body scrolls without bars from the line below the header, its rows half the smallest spacing apart
  `.nano-table thead th { border-bottom: ${LINE}; }`,
  '.nano-table tbody { overflow-y: auto; scrollbar-width: none; align-content: start; row-gap: calc(var(--mantine-spacing-xs) / 2); padding-top: calc(var(--mantine-spacing-xs) / 2); }',
  `.nano-table tbody td { background: ${shade('5%')}; transition: background 120ms; }`,
  `.nano-table tbody tr:hover td, .nano-table tbody tr:focus-visible td { background: ${tint('14%')}; }`,
  `.nano-table tbody tr:focus-visible { outline: ${rem(2)} solid ${ACCENT}; outline-offset: calc(-1 * ${rem(2)}); border-radius: var(--mantine-radius-md); }`,
  ...ROW_ENDS,
  // Inputs on light: a border and a placeholder that reach the contrast of WCAG (3:1 and 4.5:1); dark, focus and error keep Mantine's
  '.mantine-Input-input:not(:focus):not([data-error]) { border-color: light-dark(var(--mantine-color-gray-6), var(--mantine-color-dark-4)); }',
  `.mantine-Input-input::placeholder { color: light-dark(${shade('55%')}, var(--mantine-color-placeholder)); }`,
  '@media (prefers-reduced-motion: reduce) { .nano-table tbody td { transition: none; } }',
].join('\n');

/** Theme of nano-app under the app's: every text in the text's color, titles of any kind in the headings' font and weight, sized by the headings' scale (page `h2`, modal, drawer and brand `h3`, column and notification `h5`), every other text `sm` and every control in its default size, the primary color only on what acts (buttons, icons, active links, hover, focus) and on borders and lines; `md` corners on everything, as the browser's window, glass cards, centered modals that fade in as one card on the part of the app's ground behind them under the veil of the glass cards, its title, content and actions apart by lines, tables without bars whose rows are rounded bands (`NANO_CSS`), texts, red buttons, and on light the borders and placeholders of inputs, with the contrast of WCAG, and motion only when the system allows it */
export const NANO_THEME: MantineThemeOverride = {
  respectReducedMotion: true,
  defaultRadius: 'md',
  components: {
    Paper: { styles: GLASS },
    Card: { styles: GLASS },
    Modal: {
      defaultProps: {
        centered: true,
        withCloseButton: false,
        // A fade: a transform, as the one of pop, would undo the fixed ground of its content
        transitionProps: { transition: 'fade', duration: 180 },
        // A light overlay that blurs the page, so the glass takes the ground of the app instead of a dark gray
        overlayProps: { backgroundOpacity: 0.25, blur: 'var(--mantine-spacing-xs)' },
      },
      styles: {
        // One solid card on the ground of the app under the veil of the glass cards, both fixed to the screen, so it shows the part behind it as strong as they do; its title centered and apart by a line
        content: {
          ...GROUND,
          background: `linear-gradient(${VEIL}, ${VEIL}), ${GROUND.background}`,
          border: LINE,
        },
        header: { justifyContent: 'center', background: 'transparent', borderBottom: LINE },
        title: { ...HEADING, fontSize: 'var(--mantine-h3-font-size)' },
      },
    },
    Drawer: { styles: { title: { ...HEADING, fontSize: 'var(--mantine-h3-font-size)' } } },
    Notification: { styles: { title: { ...HEADING, fontSize: 'var(--mantine-h5-font-size)' } } },
    Title: { styles: { root: HEADING } },
    Text: { defaultProps: { size: 'sm' } },
    Anchor: { defaultProps: { size: 'sm' } },
    Table: {
      classNames: { table: 'nano-table' },
      defaultProps: { withRowBorders: false, verticalSpacing: 'xs', horizontalSpacing: 'md' },
      styles: {
        th: { ...HEADING, fontSize: 'var(--mantine-h5-font-size)' },
        td: { fontVariantNumeric: 'tabular-nums' },
      },
    },
    TableScrollContainer: {
      defaultProps: { type: 'native' },
      // Scrolls sideways only, without bars; it and its inner box pass their height down to the table, whose body scrolls
      styles: {
        scrollContainer: {
          scrollbarWidth: 'none',
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
        scrollContainerInner: { display: 'flex', flexDirection: 'column', minHeight: 0 },
      },
    },
    Divider: { styles: { root: { '--divider-color': BORDER } } },
    Avatar: { defaultProps: (oTheme: MantineTheme) => ({ color: oTheme.primaryColor }) },
    NavLink: { defaultProps: { variant: 'filled' } },
  },
};
