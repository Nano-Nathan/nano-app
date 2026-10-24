'use client';

import { useEffect } from 'react';
import list from '@nano-app/components/list';

/** Users of the backend store, five per page, sortable by name */
export default list({ path: '/users', top: 5, store: 'backend' }).bindView(
  ({ stores: { backend }, load, items, next, prev, sort }) => {
    // Reads the first page once the view is on the page
    useEffect(() => {
      load();
    }, []);

    return (
      <section>
        <button onClick={() => sort('name')}>name</button>
        <ul>
          {(items()?.result ?? []).map((oUser: { id: number; name: string }) => (
            <li key={oUser.id}>{oUser.name}</li>
          ))}
        </ul>
        <button onClick={prev}>←</button> {(backend.get('/list/page') ?? 0) + 1}{' '}
        <button onClick={next}>→</button>
      </section>
    );
  },
);
