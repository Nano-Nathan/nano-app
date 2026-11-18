'use client';

import {
  ActionIcon,
  Button,
  Group,
  Notification,
  Popover,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { createView } from '@nano-app/frontend';
import BellIcon from './components/BellIcon';
import NotificationCenterController from './NotificationCenterController';

/** A bell that opens the history from the newest, to remove one or all */
export default createView(NotificationCenterController, center => (
  <Popover position="bottom-end" shadow="md" radius="md">
    <Popover.Target>
      <ActionIcon variant="subtle" radius="xl" size="lg" aria-label={center.texts().title}>
        <BellIcon />
      </ActionIcon>
    </Popover.Target>
    <Popover.Dropdown w={{ base: '90vw', sm: '50vw', md: '30vw' }}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>{center.texts().title}</Text>
          <Button variant="subtle" size="xs" onClick={center.clear}>
            {center.texts().clear}
          </Button>
        </Group>
        {!center.items().length && (
          <Text size="sm" c="dimmed">
            {center.texts().empty}
          </Text>
        )}
        <ScrollArea.Autosize mah="60dvh">
          <Stack gap="xs">
            {center.newest().map(oItem => (
              <Notification
                key={oItem.id}
                withBorder
                color={center.color(oItem.type)}
                title={oItem.title}
                onClose={() => center.remove(oItem.id)}
              >
                {oItem.message}
                <Text size="xs" c="dimmed">
                  {center.time(oItem.timestamp)}
                </Text>
              </Notification>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Stack>
    </Popover.Dropdown>
  </Popover>
));
