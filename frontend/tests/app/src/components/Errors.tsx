'use client';

import { createView } from '@nano-app/frontend';
import NotificationController from '@nano-app/controllers/notification';

/** Notifications with two methods that fail a read and a write */
class ErrorsController extends NotificationController {
  /** Reads a path the backend does not have, and collects its error */
  public async failRead(): Promise<void> {
    await this.stores.backend.GET('/missing');
    this.collect();
  }

  /** Writes a path the backend does not have, and collects its error */
  public async failWrite(): Promise<void> {
    await this.stores.backend.PUT('/missing', {});
    this.collect();
  }
}

/** Failed requests of the api stores as notifications, with buttons that fail a read and a write */
export default createView(ErrorsController, errors => (
  <section>
    <ul>
      {errors.items().map(oItem => (
        <li key={oItem.id}>
          {oItem.message}
          <button onClick={() => errors.remove(oItem.id)}>remove</button>
        </li>
      ))}
    </ul>
    <button onClick={errors.failRead}>fail read</button>
    <button onClick={errors.failWrite}>fail write</button>
    <button onClick={errors.clear}>clear</button>
  </section>
));
