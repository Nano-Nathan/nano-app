import { Avatar, NavLink, Tooltip } from '@mantine/core';
import ColorScheme from './ColorScheme';
import Logout from './Logout';
import Slot from './Slot';
import type { CSSProperties, ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ShellItems, ShellUser } from '../../../types/shell';

/** The items of the bottom that are on: the user of the session, the color scheme and its sign-out */
export default function Account({
  user,
  items,
  login,
  theme,
  isOpen,
  styles,
  linkStyles,
}: {
  user: ShellUser;
  items: ShellItems;
  login: string;
  theme: string;
  isOpen: boolean;
  styles: NanoObject<CSSProperties>;
  linkStyles: NanoObject<CSSProperties>;
}): ReactNode {
  return (
    <>
      {items.user && (
        <Tooltip label={`${user.name} · ${user.email}`} position="right" disabled={isOpen}>
          <NavLink
            component="div"
            label={user.name}
            description={user.email}
            noWrap
            leftSection={
              <Slot>
                <Avatar src={user.image} name={user.name} size="md" />
              </Slot>
            }
            styles={styles}
          />
        </Tooltip>
      )}
      {items.theme && <ColorScheme label={theme} isOpen={isOpen} styles={linkStyles} />}
      {items.logout && <Logout login={login} isOpen={isOpen} styles={linkStyles} />}
    </>
  );
}
