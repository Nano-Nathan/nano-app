import AppController from '../utils/AppController';
import type { ApiError } from '@nano-app/frontend';
import type { Notification, NotificationInput } from '../types/notification';

export type { Notification, NotificationInput, NotificationType } from '../types/notification';

/** Notifications of the app at `/notification/list` of `app`, the api errors among them, for a view to show */
export default class NotificationController extends AppController {
  /** Path of its state */
  protected root = '/notification';

  /** Adds a notification after the ones before */
  public notify(oInput: NotificationInput): void {
    const oNotification: Notification = { ...oInput, id: crypto.randomUUID() };
    this.set('/list', [...this.items(), oNotification]);
  }

  /** The notifications kept, from the oldest */
  public items(): Notification[] {
    return this.get('/list') ?? [];
  }

  /** The failed requests every store keeps at `/error/list` */
  public errors(): ApiError[] {
    return Object.values(this.stores).flatMap(oStore => oStore.get('/error/list') ?? []);
  }

  /** Moves the failed requests of every store to the notifications, as errors */
  public collect(): void {
    for (const oStore of Object.values(this.stores)) {
      // Skips a store without errors
      const aErrors: ApiError[] = oStore.get('/error/list') ?? [];
      if (!aErrors.length) continue;

      // Empties its list and notifies each one
      oStore.set('/error/list', []);
      for (const oError of aErrors) this.notify({ type: 'error', message: oError.message ?? '' });
    }
  }

  /** Empties the notifications */
  public clear(): void {
    this.set('/list', []);
  }
}
