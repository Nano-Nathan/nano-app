'use client';

import {
  ActionIcon,
  AppShell,
  Avatar,
  CloseButton,
  NavLink,
  Paper,
  Stack,
  Tooltip,
} from '@mantine/core';
import Link from 'next/link';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { NavController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import {
  SHELL_BRAND,
  SHELL_LABEL,
  SHELL_LINK,
  SHELL_SIZES,
  SHELL_STATIC,
  SHELL_STYLES,
  SHELL_TEXT,
} from './const';
import Account from './components/Account';
import Slot from './components/Slot';
import type { ShellLink } from '../../types/shell';

/** The navbar with the brand, the links and the user, and the page with the button that opens and closes it */
export default createView(
  NavController,
  (nav, { title, logo, links, items, login, user, children }) => {
    // Open, the navbar shows its texts; closed, only its icons on a desktop
    const isOpen = nav.isToggled();
    const oShell = isOpen
      ? {
          width: SHELL_SIZES.navbar,
          text: SHELL_TEXT.open,
          icon: <IconLayoutSidebarLeftCollapse />,
        }
      : { width: SHELL_SIZES.rail, text: SHELL_TEXT.closed, icon: <IconLayoutSidebarLeftExpand /> };
    const oLinkStyles = { root: SHELL_LINK, body: oShell.text, label: SHELL_LABEL };
    const oStaticStyles = { ...oLinkStyles, root: { ...SHELL_LINK, ...SHELL_STATIC } };
    const oBrandStyles = { ...oStaticStyles, label: SHELL_BRAND };
    const sMenu = nav.text('nano.shell.menu');
    const oLogo = <Avatar src={logo} name={title} size="md" radius="sm" />;
    return (
      <AppShell
        layout="alt"
        navbar={{
          width: oShell.width,
          breakpoint: 'sm',
          collapsed: { mobile: !isOpen },
        }}
        withBorder={false}
        styles={SHELL_STYLES}
      >
        <AppShell.Navbar>
          <Paper withBorder shadow="xs" radius="md" h="100%" p="xs">
            <Stack h="100%" gap={0}>
              <AppShell.Section mt="xs" mb="xl">
                <NavLink
                  component="div"
                  label={title}
                  fw={700}
                  noWrap
                  leftSection={<Slot>{oLogo}</Slot>}
                  rightSection={
                    <CloseButton onClick={nav.toggle} aria-label={sMenu} hiddenFrom="sm" />
                  }
                  styles={oBrandStyles}
                />
              </AppShell.Section>
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
                      leftSection={<Slot isActive={nav.isActive(oLink.href)}>{oLink.icon}</Slot>}
                      styles={oLinkStyles}
                      active={nav.isActive(oLink.href)}
                      onClick={nav.close}
                    />
                  </Tooltip>
                ))}
              </AppShell.Section>
              <AppShell.Section>
                <Account
                  user={user}
                  items={items}
                  login={login}
                  theme={nav.text('nano.shell.theme')}
                  isOpen={isOpen}
                  styles={oStaticStyles}
                  linkStyles={oLinkStyles}
                />
              </AppShell.Section>
            </Stack>
          </Paper>
        </AppShell.Navbar>
        <AppShell.Main display="flex">
          <Paper withBorder shadow="xs" radius="md" p="md" flex={1}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              mb="xs"
              aria-label={sMenu}
              onClick={nav.toggle}
            >
              {oShell.icon}
            </ActionIcon>
            {children}
          </Paper>
        </AppShell.Main>
      </AppShell>
    );
  },
);
