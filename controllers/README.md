# @nano-app/controllers

[![controllers](https://img.shields.io/npm/v/@nano-app/controllers?label=controllers)](https://www.npmjs.com/package/@nano-app/controllers)

Official controllers for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend): the logic of sign-in, forms, fields, lists, navigation and messages, ready to use. No markup and no styles: write the view, or take it from [`@nano-app/mantine`](https://www.npmjs.com/package/@nano-app/mantine).

```bash
pnpm add @nano-app/frontend @nano-app/controllers
```

```tsx
'use client';

import { createView } from '@nano-app/frontend';
import { CollectionController } from '@nano-app/controllers';

class UsersController extends CollectionController {
  protected root = '/collection/users';
  protected path = '/users';
}

export default createView(UsersController, users => (
  <ul>
    {users.items()?.result?.map(oUser => (
      <li key={oUser.id}>{oUser.name}</li>
    ))}
  </ul>
));
```

**Documentation:** [reference](https://nano-app-docs.pages.dev/reference/controllers), and the [tutorial](https://nano-app-docs.pages.dev/tutorial/) to start.
