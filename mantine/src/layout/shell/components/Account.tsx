import { Avatar, NavLink, Tooltip } from '@mantine/core';
import Logout from './Logout';
import Slot from './Slot';
import type { CSSProperties, ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ShellUser } from '../../../types/shell';

/** The user of the session, its photo or initials with its name and email, and its sign-out */
export default function Account({
  user,
  login,
  isOpen,
  styles,
  linkStyles,
}: {
  user: ShellUser;
  login: string;
  isOpen: boolean;
  styles: NanoObject<CSSProperties>;
  linkStyles: NanoObject<CSSProperties>;
}): ReactNode {
  return (
    <>
      <Tooltip label={`${user.name} · ${user.email}`} position="right" disabled={isOpen}>
        <NavLink
          component="div"
          label={user.name}
          description={user.email}
          noWrap
          leftSection={
            <Slot>
              <Avatar src={user.image} name={user.name} color="initials" size="md" />
            </Slot>
          }
          styles={styles}
        />
      </Tooltip>
      <Logout login={login} isOpen={isOpen} styles={linkStyles} />
    </>
  );
}
