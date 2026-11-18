'use client';

import { AppShell, Avatar, Burger, Group, NavLink, Title, Tooltip } from '@mantine/core';
import Link from 'next/link';
import { NavController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { SHELL_SIZES, SHELL_TEXT } from '../../const';
import Logout from './components/Logout';
import User from './components/User';
import type { ShellLink } from '../../types/shell';

/** The header with the burger, the logo and the title, the navbar with the links and the user, and the page */
export default createView(NavController, (nav, { title, logo, links, login, user, children }) => {
  // Open, the navbar shows its texts; closed, only its icons on a desktop
  const isOpen = nav.isToggled();
  const oShell = isOpen
    ? { width: SHELL_SIZES.navbar, text: SHELL_TEXT.open }
    : { width: SHELL_SIZES.rail, text: SHELL_TEXT.closed };
  return (
    <AppShell
      header={{ height: SHELL_SIZES.header }}
      navbar={{
        width: oShell.width,
        breakpoint: 'sm',
        collapsed: { mobile: !isOpen },
      }}
      styles={{ navbar: { transitionProperty: 'transform, width', overflow: 'hidden' } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={isOpen}
            onClick={nav.toggle}
            aria-label={nav.text('nano.shell.menu')}
            size="sm"
          />
          {logo && <Avatar src={logo} alt={title} size="md" radius="sm" />}
          <Title order={3}>{title}</Title>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          {links.map((oLink: ShellLink) => (
            <Tooltip
              key={oLink.href}
              label={nav.text(oLink.label)}
              position="right"
              disabled={isOpen}
            >
              <NavLink
                component={Link}
                href={oLink.href}
                aria-label={nav.text(oLink.label)}
                label={nav.text(oLink.label)}
                noWrap
                leftSection={oLink.icon}
                styles={{ body: oShell.text }}
                active={nav.isActive(oLink.href)}
                onClick={nav.close}
              />
            </Tooltip>
          ))}
        </AppShell.Section>
        <AppShell.Section>
          <User user={user} isOpen={isOpen} text={oShell.text} />
          <Logout login={login} isOpen={isOpen} text={oShell.text} />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
});
