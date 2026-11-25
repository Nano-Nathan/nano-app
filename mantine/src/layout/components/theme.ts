import { HEADING, heading, NANO_CLASSES } from '../../const';
import { BORDER, GLASS, GROUND, LINE, MODAL_OVERLAY, MODAL_TRANSITION, VEIL } from './const';
import type { MantineTheme, MantineThemeOverride } from '@mantine/core';

/** Theme of nano-app under the app's: its look as `CLAUDE.md` sets it ("UX standards"); the values an app can change are the `TOKENS` of the package */
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
        transitionProps: MODAL_TRANSITION,
        overlayProps: MODAL_OVERLAY,
      },
      styles: {
        // One solid card on the ground of the app under the veil of the glass cards, both fixed to the screen, so it shows the part behind it as strong as they do
        content: {
          ...GROUND,
          background: `linear-gradient(${VEIL}, ${VEIL}), ${GROUND.background}`,
          border: LINE,
        },
        header: { justifyContent: 'center', background: 'transparent', borderBottom: LINE },
        title: heading('modal'),
      },
    },
    Drawer: { styles: { title: heading('drawer') } },
    Notification: { styles: { title: heading('notification') } },
    Title: { styles: { root: HEADING } },
    Text: { defaultProps: { size: 'sm' } },
    Anchor: { defaultProps: { size: 'sm' } },
    Table: {
      classNames: { table: NANO_CLASSES.table },
      defaultProps: { withRowBorders: false, verticalSpacing: 'xs', horizontalSpacing: 'md' },
      styles: { th: heading('column'), td: { fontVariantNumeric: 'tabular-nums' } },
    },
    TableScrollContainer: {
      defaultProps: { type: 'native' },
      // Scrolls sideways only, without bars, at most as high as the space left; it and its inner box pass their height down to the table, whose body scrolls
      styles: {
        scrollContainer: {
          flex: '0 1 auto',
          minHeight: 0,
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
