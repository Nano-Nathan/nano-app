import type { MantineProviderProps } from '@mantine/core';

/** Options of `createLayout`: the language of the html and the props of `MantineProvider` */
export type LayoutOptions = Omit<MantineProviderProps, 'children'> & {
  /** Language of the html (`es`) */
  lang: string;
};
