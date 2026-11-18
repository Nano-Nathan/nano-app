import NotificationController from '@nano-app/components/notification';
import { NOTIFICATION_COLORS } from '../../../const';
import type { Notification as AppNotification } from '@nano-app/components/notification';
import type { NotificationCenterTexts } from '../../../types/notifications';

/** English texts of the center */
const TEXTS: NotificationCenterTexts = {
  title: 'Notifications',
  clear: 'Clear',
  empty: 'No notifications',
};

/** The history of the app's notifications behind a bell */
export default class NotificationCenterController extends NotificationController {
  /** The given texts over the English ones */
  public texts(): NotificationCenterTexts {
    return { ...TEXTS, ...this.props.texts };
  }

  /** Mantine color of a kind, the given ones over the defaults */
  public color(sType: string): string {
    const oColors = { ...NOTIFICATION_COLORS, ...this.props.colors };
    return Reflect.get(oColors, sType);
  }

  /** The history from the newest */
  public newest(): AppNotification[] {
    return [...this.items()].reverse();
  }

  /** Hour and minute of a notification, in the user's locale */
  public time(iTimestamp: number): string {
    return new Date(iTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
