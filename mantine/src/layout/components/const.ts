import { rem } from '@mantine/core';
import { PRIMARY_TINT, token } from '../../const';

/** The primary color of the accents: the filled one on light, its shade 4 on dark, where the filled one is too dark to see */
export const ACCENT =
  'light-dark(var(--mantine-primary-color-filled), var(--mantine-primary-color-4))';

/** The accent faded to a part of itself over what is behind it */
export function tint(sPart: string): string {
  return `color-mix(in srgb, ${ACCENT} ${sPart}, transparent)`;
}

/** The text color faded to a part of itself: a neutral tint that follows the scheme */
export function shade(sPart: string): string {
  return `color-mix(in srgb, var(--mantine-color-text) ${sPart}, transparent)`;
}

/** Color of the borders and lines */
export const BORDER = tint(token('border'));

/** A line of the border's color */
export const LINE = `${rem(1)} solid ${BORDER}`;

/** The veil of a card of glass over the ground: the body at most of its strength */
export const VEIL = `color-mix(in srgb, var(--mantine-color-body) ${token('veil')}, transparent)`;

/** A card of glass: the ground blurred behind it, its border in the primary color */
export const GLASS = {
  root: {
    '--paper-border-color': BORDER,
    background: VEIL,
    backdropFilter: 'blur(var(--mantine-spacing-md))',
  },
};

/** Ground of the app: the body with a glow of the primary color in two corners, fixed to the screen */
export const GROUND = {
  background: [
    `radial-gradient(circle at 0% 0%, ${PRIMARY_TINT}, transparent ${token('glow')})`,
    `radial-gradient(circle at 100% 100%, ${PRIMARY_TINT}, transparent ${token('glow')})`,
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

/** How a modal comes and goes: a fade, as a transform (that of pop) would undo the fixed ground of its content */
export const MODAL_TRANSITION = { transition: 'fade', duration: 180 };

/** The overlay of a modal: light, so the page shows, and blurred */
export const MODAL_OVERLAY = { backgroundOpacity: 0.25, blur: 'var(--mantine-spacing-xs)' };
