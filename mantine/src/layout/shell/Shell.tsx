'use client';

import {
  ActionIcon,
  AppShell,
  Avatar,
  CloseButton,
  Grid,
  NavLink,
  Paper,
  Stack,
  Title,
} from '@mantine/core';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { NavController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import {
  SHELL_BRAND,
  SHELL_GAP,
  SHELL_LABEL,
  SHELL_LINK,
  SHELL_SIZES,
  SHELL_STATIC,
  SHELL_STYLES,
  SHELL_TEXT,
} from './const';
import Account from './components/Account';
import NavItem from './components/NavItem';
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
                <Stack gap={SHELL_GAP}>
                  {links.map((oLink: ShellLink) => (
                    <NavItem key={oLink.label} link={oLink} styles={oLinkStyles} />
                  ))}
                </Stack>
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
          <Stack gap={0} flex={1} miw={0}>
            <Paper withBorder shadow="xs" radius="md" p="xs">
              <Grid align="center">
                <Grid.Col span={2}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    aria-label={sMenu}
                    onClick={nav.toggle}
                  >
                    {oShell.icon}
                  </ActionIcon>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Title order={3} ta="center">
                    {nav.title()}
                  </Title>
                </Grid.Col>
              </Grid>
            </Paper>
            <Paper withBorder shadow="xs" radius="md" p="md" flex={1}>
              {children}
            </Paper>
          </Stack>
        </AppShell.Main>
      </AppShell>
    );
  },
);
