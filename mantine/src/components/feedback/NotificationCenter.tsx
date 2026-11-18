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
import NotificationController from '@nano-app/components/notification';
import { NOTIFICATION_COLORS } from '../../const';
import BellIcon from './BellIcon';
import type { Notification as AppNotification } from '@nano-app/components/notification';
import type { NotificationCenterTexts } from '../../types/notifications';

/** English texts of the center */
const TEXTS: NotificationCenterTexts = {
  title: 'Notifications',
  clear: 'Clear',
  empty: 'No notifications',
};

/** The history of the app's notifications behind a bell */
class CenterController extends NotificationController {
  /** The given texts over the English ones */
  public texts(): NotificationCenterTexts {
    return { ...TEXTS, ...this.props.texts };
  }

  /** Mantine color of a kind, the given ones over the defaults */
  public color(sType: string): string {
    const oColors = { ...NOTIFICATION_COLORS, ...this.props.colors };
    return Reflect.get(oColors, sType);
  }

  /** The history from the newest */
  public newest(): AppNotification[] {
    return [...this.items()].reverse();
  }

  /** Hour and minute of a notification, in the user's locale */
  public time(iTimestamp: number): string {
    return new Date(iTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/** A bell that opens the history from the newest, to remove one or all */
export default createView(CenterController, center => (
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
