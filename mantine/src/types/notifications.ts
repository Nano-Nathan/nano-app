import type { NotificationsProps } from '@mantine/notifications';

/** Kind of a notification: its color */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/** What `notify` shows */
export type NotificationInput = {
  /** Its kind */
  type: NotificationType;
  /** Its text */
  message: string;
  /** Its title, above the text */
  title?: string;
};

/** Options of the toasts: the props of Mantine's `Notifications` (`position`, `autoClose`, `limit`…) */
export type NotificationsOptions = NotificationsProps;
