import MessageController from '@nano-app/controllers/message';
import notify from '../notify';

/** Shows each message of the api stores as a toast of its kind, and empties their lists */
export default class ToastsController extends MessageController {
  /** Notifies the messages kept, if any, and empties their lists */
  public show(): void {
    // Nothing to show
    const aMessages = this.items();
    if (!aMessages.length) return;

    // Notifies each one by its answer: failed, a warning or a success
    for (const { success, warning, message = '' } of aMessages) {
      const sType = warning ? 'warning' : 'success';
      notify({ type: success ? sType : 'error', message });
    }
    this.clear();
  }
}
