import type { NotificationsProps } from '@mantine/notifications';
import type { ApiMessage } from '@nano-app/frontend';

/** Kind of a notification, the same as a message of the backend: its color */
export type NotificationType = ApiMessage['type'];

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
