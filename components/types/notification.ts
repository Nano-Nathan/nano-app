/** Kind of a notification: its color and whether the app shows it */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/** What a controller notifies */
export type NotificationInput = {
  /** Its kind */
  type: NotificationType;
  /** Its text */
  message: string;
  /** Its title, above the text */
  title?: string;
};

/** A notification of the history at `/notification/list` of `app` */
export type Notification = NotificationInput & {
  /** Its id, unique in the list */
  id: string;
  /** Milliseconds since the epoch, from `Date.now()` */
  timestamp: number;
  /** Whether a view already showed it once (a toast) */
  shown: boolean;
};
