'use client';

import { createView } from '@nano-app/frontend';
import MessageController from '@nano-app/controllers/message';

/** Errors with two methods that fail a read and a write */
class MessagesController extends MessageController {
  /** Reads a path the backend does not have */
  public failRead(): Promise<unknown> {
    return this.stores.backend.GET('/missing');
  }

  /** Writes a path the backend does not have */
  public failWrite(): Promise<unknown> {
    return this.stores.backend.PUT('/missing', {});
  }
}

/** Failed requests of the api stores, with buttons that fail a read and a write */
export default createView(MessagesController, errors => (
  <section>
    <ul>
      {errors.items().map((oError, iIndex) => (
        <li key={iIndex}>
          {oError.message}
          <button onClick={() => errors.remove(iIndex)}>remove</button>
        </li>
      ))}
    </ul>
    <button onClick={errors.failRead}>fail read</button>
    <button onClick={errors.failWrite}>fail write</button>
    <button onClick={errors.clear}>clear</button>
  </section>
));
