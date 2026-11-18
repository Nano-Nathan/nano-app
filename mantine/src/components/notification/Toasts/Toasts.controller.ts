import { notifications } from '@mantine/notifications';
import NotificationController from '@nano-app/controllers/notification';
import { NOTIFICATION_COLORS } from '../../../const';

/** Shows the notifications of the app as toasts, of the kinds of the props */
export default class ToastsController extends NotificationController {
  /** Moves the api errors to the notifications, shows them and empties the list */
  public show(): void {
    // Takes the failed requests of the stores
    this.collect();

    // Nothing to show
    const aItems = this.items();
    if (!aItems.length) return;

    // Shows each one of a kind the app shows, with its color
    const { types, colors } = this.props;
    const oColors = { ...NOTIFICATION_COLORS, ...colors };
    for (const { id, type, title, message } of aItems) {
      if (!types || types.includes(type))
        notifications.show({ id, color: oColors[type], title, message });
    }

    // Leaves them to Mantine
    this.clear();
  }
}
