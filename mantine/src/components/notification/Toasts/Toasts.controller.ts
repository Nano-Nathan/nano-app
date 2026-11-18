import { notifications } from '@mantine/notifications';
import MessageController from '@nano-app/controllers/message';
import { NOTIFICATION_COLORS } from '../../../const';

/** Shows each message of the api stores as a toast of its type, and empties their lists */
export default class ToastsController extends MessageController {
  /** Shows the messages kept, if any, and empties their lists */
  public show(): void {
    // Nothing to show
    const aMessages = this.items();
    if (!aMessages.length) return;

    // Shows each one in the color of its type
    for (const { type, message } of aMessages)
      notifications.show({ message, color: NOTIFICATION_COLORS[type] });
    this.clear();
  }
}
