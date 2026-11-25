import { PRIMARY_TEXT, PRIMARY_TINT } from '../../const';
import type { MantineTheme, MantineThemeOverride } from '@mantine/core';

/** Ground of the app: the body with a glow of the primary color in two corners */
export const GROUND = {
  background: [
    `radial-gradient(circle at 0% 0%, ${PRIMARY_TINT}, transparent 50%)`,
    `radial-gradient(circle at 100% 100%, ${PRIMARY_TINT}, transparent 50%)`,
    'var(--mantine-color-body)',
  ].join(', '),
  backgroundAttachment: 'fixed',
};

/** A card of glass: the ground blurred behind it, its border in the primary color */
const GLASS = {
  root: {
    '--paper-border-color':
      'color-mix(in srgb, var(--mantine-primary-color-filled) 35%, transparent)',
    background: 'color-mix(in srgb, var(--mantine-color-body) 70%, transparent)',
    backdropFilter: 'blur(var(--mantine-spacing-md))',
  },
};

/** Theme of nano-app under the app's: cards of glass, solid modals centered over their overlay, and the primary color on titles, table headers, input labels, avatars and active links */
export const NANO_THEME: MantineThemeOverride = {
  components: {
    Paper: { styles: GLASS },
    Card: { styles: GLASS },
    Modal: {
      defaultProps: { centered: true },
      styles: { content: { background: 'var(--mantine-color-body)' } },
    },
    Title: { styles: { root: { color: PRIMARY_TEXT } } },
    Table: { styles: { th: { color: PRIMARY_TEXT } } },
    InputWrapper: { styles: { label: { color: PRIMARY_TEXT } } },
    Avatar: { defaultProps: (oTheme: MantineTheme) => ({ color: oTheme.primaryColor }) },
    NavLink: { defaultProps: { variant: 'filled' } },
  },
};
