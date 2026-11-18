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

/** A notification kept at `/notification/list` of `app`, until a view shows it */
export type Notification = NotificationInput & {
  /** Its id, unique in the list */
  id: string;
};
