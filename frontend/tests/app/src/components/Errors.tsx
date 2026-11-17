'use client';

import { createView } from '@nano-app/frontend';
import ErrorController from '@nano-app/components/error';

/** Errors with two methods that fail a read and a write */
class ErrorsController extends ErrorController {
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
export default createView(ErrorsController, errors => (
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
