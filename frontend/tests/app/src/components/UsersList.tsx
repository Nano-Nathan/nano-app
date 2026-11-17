'use client';

import { createView } from '@nano-app/frontend';
import CollectionController from '@nano-app/components/collection';

/** Users of the backend store, five per page */
class UsersPageController extends CollectionController {
  public name = 'users';
  public path = '/users';
  public limit = 5;
  public store = 'backend';
}

/** Users of the backend store, a page at a time, sortable by name */
export default createView(UsersPageController, users => (
  <section>
    <button onClick={() => users.sort('name')}>name</button>
    <ul>
      {(users.items()?.result ?? []).map((oUser: { id: number; name: string }) => (
        <li key={oUser.id}>{oUser.name}</li>
      ))}
    </ul>
    <button onClick={users.prev}>←</button> {users.page() + 1}{' '}
    <button onClick={users.next}>→</button>
  </section>
));
