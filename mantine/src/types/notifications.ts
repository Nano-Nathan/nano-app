import type { NotificationsProps } from '@mantine/notifications';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { NotificationType } from '@nano-app/components/notification';

/** Options of the notifications: which kinds show, their colors, and the props of Mantine's */
export type NotificationsOptions = NotificationsProps & {
  /** Kinds the app shows (every kind by default) */
  types?: NotificationType[];
  /** Mantine color of each kind (`{ error: 'red' }`), over the defaults */
  colors?: Partial<NanoObject<string>>;
};

/** Texts of the notification center */
export type NotificationCenterTexts = {
  /** Title of the history, and the name of the bell */
  title: string;
  /** Button that empties the history */
  clear: string;
  /** Line of an empty history */
  empty: string;
};
