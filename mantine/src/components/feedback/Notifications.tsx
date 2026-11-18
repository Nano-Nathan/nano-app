'use client';

import { useEffect } from 'react';
import { Notifications as MantineNotifications, notifications } from '@mantine/notifications';
import { createView } from '@nano-app/frontend';
import NotificationController from '@nano-app/components/notification';

/** Mantine color of each kind */
const COLORS = { success: 'green', error: 'red', info: 'blue', warning: 'yellow' };

/** Shows the notifications of the app with Mantine's, the kinds of the props only */
class ShowController extends NotificationController {
  /** Shows each notification kept, of the kinds of the props, and empties the list */
  public show(): void {
    // Nothing to show
    const aItems = this.items();
    if (!aItems.length) return;

    // Shows each one of a kind the app shows, with its color
    const { types, colors } = this.props;
    const oColors = { ...COLORS, ...colors };
    for (const { id, type, title, message } of aItems) {
      if (!types || types.includes(type))
        notifications.show({ id, color: oColors[type], title, message });
    }

    // Leaves them to Mantine
    this.clear();
  }
}

/** Mantine's notifications, fed by the notifications of the app */
export default createView(
  ShowController,
  (notify, { types: _aTypes, colors: _oColors, ...oProps }) => {
    useEffect(notify.show, [notify.items()]);
    return <MantineNotifications position="top-center" autoClose={3000} {...oProps} />;
  },
);
