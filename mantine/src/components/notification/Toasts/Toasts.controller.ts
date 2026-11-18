import { notifications } from '@mantine/notifications';
import NotificationController from '@nano-app/components/notification';
import { NOTIFICATION_COLORS } from '../../../const';

/** Shows each new notification of the app once, of the kinds of the props */
export default class ToastsController extends NotificationController {
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
