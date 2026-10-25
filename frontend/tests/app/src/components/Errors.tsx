'use client';

import error from '@nano-app/components/error';

/** Failed requests of the api stores, with buttons that fail a read and a write */
export default error()
  .extend(({ stores: { backend } }) => ({
    failRead: () => backend.read('/missing'),
    failWrite: () => backend.update('/missing', {}),
  }))
  .bindView(({ items, dismiss, clear, failRead, failWrite }) => (
    <section>
      <ul>
        {items().map((oError, iIndex) => (
          <li key={iIndex}>
            {oError.message}
            <button onClick={() => dismiss(oError)}>dismiss</button>
          </li>
        ))}
      </ul>
      <button onClick={failRead}>fail read</button>
      <button onClick={failWrite}>fail write</button>
      <button onClick={clear}>clear</button>
    </section>
  ));
