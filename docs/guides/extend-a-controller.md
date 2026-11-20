# Change a ready controller

The controllers of `@nano-app/controllers` are classes. Use this to change one method of one and keep the rest.

## Override a method

```ts
import { AuthController } from '@nano-app/controllers';

class AuditedAuthController extends AuthController {
  public async signOut() {
    await this.stores.api.POST('/audit', { action: 'sign-out' });
    return super.signOut();
  }
}
```

`super` reaches the original.

## Set its options

A controller's options are `protected` fields. Set them in the subclass:

```ts
class UsersController extends CollectionController {
  protected root = '/collection/users';
  protected path = '/users';
  protected limit = 20;
}
```

A field without a default is `abstract`: TypeScript asks for it.

## Write your own view

Every controller works with any view. Write one with `createView`:

```tsx
'use client';

import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

export default createView(FieldController, (input, { field }) => (
  <label>
    {input.label()}
    <input value={input.value() ?? ''} onChange={oEvent => input.change(oEvent.target.value)} />
    <small>{input.error()}</small>
  </label>
));
```

Pass it to a form as the view of a field type:

```ts
class NoteFormController extends FormController {
  protected components = { text: MyInput };
}
```

**Reference:** [Controllers](/reference/controllers).
