'use client';

import { useEffect } from 'react';
import { Notifications, notifications } from '@mantine/notifications';
import { MessageController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { NOTIFICATION_COLORS } from '../../../const';

/** Mantine's notifications, with every message of the api stores shown as a toast */
export default createView(MessageController, (messages, props) => {
  // Each message of the backend, a key of the texts, as a toast in the color of its type
  useEffect(
    () =>
      messages.flush(({ type, message }) =>
        notifications.show({ message: messages.text(message), color: NOTIFICATION_COLORS[type] }),
      ),
    [messages.items()],
  );
  return <Notifications position="top-right" autoClose={3000} {...props} />;
});
