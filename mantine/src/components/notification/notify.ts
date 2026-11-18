import { notifications } from '@mantine/notifications';
import { NOTIFICATION_COLORS } from '../../const';
import type { NotificationInput } from '../../types/notifications';

/** Shows a notification now, as a toast in the color of its kind */
export default function notify(oInput: NotificationInput): void {
  const { type, ...oRest } = oInput;
  notifications.show({ ...oRest, color: NOTIFICATION_COLORS[type] });
}
