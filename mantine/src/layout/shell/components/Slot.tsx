import { ThemeIcon } from '@mantine/core';
import { PRIMARY_TEXT } from '../../../const';
import type { ReactNode } from 'react';

/** The box of the left of a row of the navbar: one size for icons and avatars, so every row lines up; its icon in the primary color, or as the text of an active link */
export default function Slot({
  isActive = false,
  children,
}: {
  isActive?: boolean;
  children: ReactNode;
}): ReactNode {
  // An active link is filled with the primary color: its icon takes the color of its text
  const sColor = isActive ? 'inherit' : PRIMARY_TEXT;
  return (
    <ThemeIcon variant="transparent" size="md" c={sColor}>
      {children}
    </ThemeIcon>
  );
}
