import type { MantineColorScheme, MantineProviderProps } from '@mantine/core';
import type { NotificationsOptions } from './notifications';

/** Options of `createLayout`, grouped by the component they reach */
export type LayoutOptions = {
  /** Language of the html (`es`) */
  lang: string;
  /** Color scheme until the user picks one: `light`, `dark` or `auto` (the system's, by default) */
  colorScheme?: MantineColorScheme;
  /** Props of `MantineProvider` (`theme`…); the color scheme is `colorScheme` */
  provider?: Omit<MantineProviderProps, 'children' | 'defaultColorScheme' | 'forceColorScheme'>;
  /** Props of Mantine's `Notifications` (`position`, `autoClose`, `limit`…) */
  notifications?: NotificationsOptions;
};
