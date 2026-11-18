import { ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';

/** The box of the left of a row of the navbar: one size for icons and avatars, so every row lines up */
export default function Slot({ children }: { children: ReactNode }): ReactNode {
  return (
    <ThemeIcon variant="transparent" size="md" c="inherit">
      {children}
    </ThemeIcon>
  );
}
