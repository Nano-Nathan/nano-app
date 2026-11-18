'use client';

import { useEffect } from 'react';
import { Notifications as MantineNotifications, notifications } from '@mantine/notifications';
import { createView } from '@nano-app/frontend';
import NotificationController from '@nano-app/components/notification';
import { NOTIFICATION_COLORS } from '../../const';

/** Shows each new notification of the app once, of the kinds of the props */
class ToastController extends NotificationController {
  /** Moves the api errors to the history and shows what was never shown */
  public show(): void {
    // Takes the failed requests of the stores
    this.collect();

    // Shows each new one of a kind the app shows, with its color, once
    const { types, colors } = this.props;
    const oColors = { ...NOTIFICATION_COLORS, ...colors };
    for (const { id, type, title, message } of this.fresh()) {
      if (!types || types.includes(type))
        notifications.show({ id, color: oColors[type], title, message });
      this.markShown(id);
    }
  }
}

/** Mantine's notifications, fed by the history of the app */
export default createView(
  ToastController,
  (toasts, { types: _aTypes, colors: _oColors, ...oProps }) => {
    useEffect(toasts.show, [toasts.items(), toasts.errors().length]);
    return <MantineNotifications position="top-center" autoClose={3000} {...oProps} />;
  },
);
