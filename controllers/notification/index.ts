import AppController from '../utils/AppController';
import type { ApiError } from '@nano-app/frontend';
import type { Notification, NotificationInput } from '../types/notification';

export type { Notification, NotificationInput, NotificationType } from '../types/notification';

/** History of the app's notifications at `/notification/list` of `app`, the api errors among them */
export default class NotificationController extends AppController {
  /** Path of its state */
  protected root = '/notification';

  /** Adds a notification to the history, not shown yet */
  public notify(oInput: NotificationInput): void {
    const oNotification: Notification = {
      ...oInput,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      shown: false,
    };
    this.set('/list', [...this.items(), oNotification]);
  }

  /** The history, from the oldest */
  public items(): Notification[] {
    return this.get('/list') ?? [];
  }

  /** The notifications no view showed yet */
  public fresh(): Notification[] {
    return this.items().filter(oItem => !oItem.shown);
  }

  /** Marks a notification as shown once */
  public markShown(sId: string): void {
    this.set(
      '/list',
      this.items().map(oItem => (oItem.id === sId ? { ...oItem, shown: true } : oItem)),
    );
  }

  /** The failed requests every store keeps at `/error/list` */
  public errors(): ApiError[] {
    return Object.values(this.stores).flatMap(oStore => oStore.get('/error/list') ?? []);
  }

  /** Moves the failed requests of every store to the history, as errors */
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

  /** Removes a notification of the history */
  public remove(sId: string): void {
    this.set(
      '/list',
      this.items().filter(oItem => oItem.id !== sId),
    );
  }

  /** Empties the history */
  public clear(): void {
    this.set('/list', []);
  }
}
