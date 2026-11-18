'use client';

import { NavLink, Tooltip } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { AuthController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';

/** Link of the navbar that signs out and goes to `login`; its text fades while the navbar is closed */
export default createView(AuthController, (auth, { isOpen, text }) => (
  <Tooltip label={auth.text('nano.shell.logout')} position="right" disabled={isOpen}>
    <NavLink
      component="button"
      aria-label={auth.text('nano.shell.logout')}
      label={auth.text('nano.shell.logout')}
      noWrap
      leftSection={<IconLogout />}
      styles={{ body: text }}
      disabled={auth.isBusy()}
      onClick={auth.signOut}
    />
  </Tooltip>
));
