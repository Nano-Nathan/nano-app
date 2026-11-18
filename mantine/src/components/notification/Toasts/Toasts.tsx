'use client';

import { useEffect } from 'react';
import { Notifications, notifications } from '@mantine/notifications';
import { MessageController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { NOTIFICATION_COLORS } from '../../../const';
import type { ApiMessage } from '@nano-app/frontend';

/** Shows a message of the backend as a toast in the color of its type */
function toast({ type, message }: ApiMessage): void {
  notifications.show({ message, color: NOTIFICATION_COLORS[type] });
}

/** Mantine's notifications, with every message of the api stores shown as a toast */
export default createView(MessageController, (messages, props) => {
  useEffect(() => messages.flush(toast), [messages.items()]);
  return <Notifications position="top-right" autoClose={3000} {...props} />;
});
