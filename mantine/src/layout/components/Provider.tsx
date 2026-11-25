'use client';

import 'dayjs/locale/es';
import { MantineProvider, mergeThemeOverrides } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { NANO_THEME } from './theme';
import type { MantineColorScheme } from '@mantine/core';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../../types/layout';

/** Mantine with the theme of nano-app under the app's, which overrides any of its parts, and its dates in the app's locale */
export default function Provider({
  provider,
  colorScheme,
  locale,
  children,
}: {
  provider: LayoutOptions['provider'];
  colorScheme: MantineColorScheme;
  locale?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <MantineProvider
      {...provider}
      theme={mergeThemeOverrides(NANO_THEME, provider?.theme ?? {})}
      defaultColorScheme={colorScheme}
    >
      <DatesProvider settings={{ locale }}>{children}</DatesProvider>
    </MantineProvider>
  );
}
