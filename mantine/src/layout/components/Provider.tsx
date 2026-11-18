'use client';

import { MantineProvider, mergeThemeOverrides } from '@mantine/core';
import { NANO_THEME } from './const';
import type { MantineColorScheme } from '@mantine/core';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../../types/layout';

/** Mantine with the theme of nano-app under the app's, which overrides any of its parts */
export default function Provider({
  provider,
  colorScheme,
  children,
}: {
  provider: LayoutOptions['provider'];
  colorScheme: MantineColorScheme;
  children: ReactNode;
}): ReactNode {
  return (
    <MantineProvider
      {...provider}
      theme={mergeThemeOverrides(NANO_THEME, provider?.theme ?? {})}
      defaultColorScheme={colorScheme}
    >
      {children}
    </MantineProvider>
  );
}
