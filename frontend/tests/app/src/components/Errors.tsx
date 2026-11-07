'use client';

import error from '@nano-app/components/error';

/** Failed requests of the api stores, with buttons that fail a read and a write */
export default error()
  .extend(({ stores: { backend } }) => ({
    failRead(): Promise<unknown> {
      // Reads a path the backend does not have
      return backend.read('/missing');
    },
    failWrite(): Promise<unknown> {
      // Writes a path the backend does not have
      return backend.update('/missing', {});
    },
  }))
  .bindView(({ items, remove, clear, failRead, failWrite }) => (
    <section>
      <ul>
        {items().map((oError, iIndex) => (
          <li key={iIndex}>
            {oError.message}
            <button onClick={() => remove(iIndex)}>remove</button>
          </li>
        ))}
      </ul>
      <button onClick={failRead}>fail read</button>
      <button onClick={failWrite}>fail write</button>
      <button onClick={clear}>clear</button>
    </section>
  ));
