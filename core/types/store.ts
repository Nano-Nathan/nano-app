import type { API_STORE_TYPE, APP_STORE_TYPE } from '../const';
import type { NanoObject } from './objects';

/** A store as its file exports it */
export type StoreFile = {
  type: typeof APP_STORE_TYPE | typeof API_STORE_TYPE;
  /** Initial state */
  data?: NanoObject;
  /** Headers the proxy adds, each value names its env var: `KEY` → `API_KEY_HEADER` */
  headers?: NanoObject<string>;
  /** Better Auth in the backend of an `api` store */
  auth?: StoreAuth;
};

/** Better Auth of an `api` store: its base path and the pages it guards */
export type StoreAuth = {
  /** Base path of Better Auth in the backend (`/api/auth`) */
  path: string;
  /** Pages that need a session; the rest are public */
  routes?: AuthRoute[];
};

/** A page that needs a session, and where it goes without one */
export type AuthRoute = {
  /** Path of the page: exact (`/admin`), or it and all below it (`/admin/*`) */
  match: string;
  /** Page it goes to when the request is not allowed (`/` by default) */
  redirect?: string;
  /** Roles of the admin plugin, any of them allows it (`admin,editor`) */
  roles?: string;
  /** Actions per resource of the admin plugin, all of them needed (`{ collections: 'read,update' }`) */
  permissions?: NanoObject<string>;
};

/** Stores of the app by name (`src/stores/app.store.ts` → `app`), as their files export them */
export type StoreFiles = NanoObject<StoreFile>;
