# Use a second backend

Every app has the `api` store, for the backend at `API_API_URL`. Use this when the frontend also talks to another backend.

## Add an api store

```ts
// src/stores/payments.store.ts
export default { type: 'api' };
```

Set its URL in the environment of the frontend. The name of the variable comes from the store's name:

```bash
API_PAYMENTS_URL=http://payments:3000
```

The store is served on `/api/payments/...`. The URL is read on the server at runtime and never reaches the browser.

## Use it

From any controller:

```ts
await this.stores.payments.POST('/charges', { amount: 100 });
```

A ready controller reads `api` by default. Move it to the other store with a field:

```ts
class ChargesController extends CollectionController {
  protected api = this.stores.payments;
  protected root = '/collection/charges';
  protected path = '/charges';
}
```

## Keep in mind

- The proxy forwards the browser's cookies to every api store's backend. Add a store only for a backend you trust with them.
- A store of `src/stores/admin/users.store.ts` is `admin_users`: its URL is `API_ADMIN_USERS_URL`.
- A request to a store without its URL answers `500` with the name of the missing variable.
