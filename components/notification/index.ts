import AppController from '../utils/AppController';
import type { Notification, NotificationInput } from '../types/notification';

export type { Notification, NotificationInput, NotificationType } from '../types/notification';

/** Notifications of the app at `/notification/list` of `app`, for a view to show them */
export default class NotificationController extends AppController {
  /** Path of its state */
  protected root = '/notification';

  /** Keeps a notification after the ones before */
  public notify(oInput: NotificationInput): void {
    const oNotification: Notification = {
      ...oInput,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.set('/list', [...this.items(), oNotification]);
  }

  /** The notifications kept, from the oldest */
  public items(): Notification[] {
    return this.get('/list') ?? [];
  }

  /** Removes a notification by its id */
  public remove(sId: string): void {
    this.set(
      '/list',
      this.items().filter(oItem => oItem.id !== sId),
    );
  }

  /** Empties the notifications */
  public clear(): void {
    this.set('/list', []);
  }
}
