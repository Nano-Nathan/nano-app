'use client';

import { NavLink, Stack, Tooltip } from '@mantine/core';
import Link from 'next/link';
import { NavController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { SHELL_GAP } from '../const';
import Slot from './Slot';
import type { ShellLink } from '../../../types/shell';

/** A row of the navbar: a link to its page, or a group that opens the menu with its links */
const NavItem = createView(NavController, (nav, { link, styles }) => {
  const { href, label, icon, links } = link as ShellLink;
  const sLabel = nav.text(label);

  // A group shows its links under it; a link leads to its page and closes the menu
  const oItem = links
    ? {
        opened: nav.isGroupOpen(label),
        onChange: () => nav.toggleGroup(label),
        active: false,
        children: (
          <Stack gap={SHELL_GAP}>
            {links.map(oLink => (
              <NavItem key={oLink.label} link={oLink} styles={styles} />
            ))}
          </Stack>
        ),
      }
    : { component: Link, href, active: nav.isActive(href), onClick: nav.close };
  return (
    <Tooltip label={sLabel} position="right" disabled={nav.isToggled()}>
      <NavLink
        {...oItem}
        aria-label={sLabel}
        label={sLabel}
        noWrap
        leftSection={<Slot isActive={oItem.active}>{icon}</Slot>}
        styles={styles}
      />
    </Tooltip>
  );
});

export default NavItem;
