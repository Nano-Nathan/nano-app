'use client';

import { createView } from '@nano-app/frontend';
import { TableController } from '@nano-app/controllers';

/** Users of the backend store */
class UsersListController extends TableController {
  protected api = this.stores.backend;
}

/** Users of the backend store, one per item */
export default createView(UsersListController, users => (
  <ul>
    {users.rows().map(oUser => (
      <li key={oUser.id}>{oUser.name}</li>
    ))}
  </ul>
));
