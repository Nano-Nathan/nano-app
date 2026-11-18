'use client';

import {
  Box,
  NavLink,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import Slot from './Slot';
import type { CSSProperties, ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Link of the navbar that switches between the light and the dark color scheme */
export default function ColorScheme({
  label,
  isOpen,
  styles,
}: {
  label: string;
  isOpen: boolean;
  styles: NanoObject<CSSProperties>;
}): ReactNode {
  // The scheme in use, `light` or `dark` also when it follows the system
  const { setColorScheme } = useMantineColorScheme();
  const sScheme = useComputedColorScheme('light');
  return (
    <Tooltip label={label} position="right" disabled={isOpen}>
      <NavLink
        component="button"
        aria-label={label}
        label={label}
        noWrap
        leftSection={
          <Slot>
            <Box component={IconMoon} darkHidden />
            <Box component={IconSun} lightHidden />
          </Slot>
        }
        styles={styles}
        onClick={() => setColorScheme(sScheme === 'dark' ? 'light' : 'dark')}
      />
    </Tooltip>
  );
}
