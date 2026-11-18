import type { MantineProviderProps } from '@mantine/core';
import type { NotificationsOptions } from './notifications';

/** Options of `createLayout`: the language of the html and the props of `MantineProvider` */
export type LayoutOptions = Omit<MantineProviderProps, 'children'> & {
  /** Language of the html (`es`) */
  lang: string;
  /** The notifications: their kinds, colors, position, time and limit */
  notifications?: NotificationsOptions;
};
