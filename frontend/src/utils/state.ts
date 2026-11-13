import { DEFAULT_REDIRECT } from '../const';
import type { GuardedRoute, StoreFile, StoreFiles } from '../types/store';

/** Store files that `withNanoApp` inlined at build time */
// `process.env.NANO_APP_STORES` stays literal so Next can replace it
const FILES: StoreFiles = JSON.parse(process.env.NANO_APP_STORES ?? '{}');

/** Stores of the app by name, as their files export them */
export const STORES = new Map<string, StoreFile>(Object.entries(FILES));

/** Headers the proxy adds per store, each with the env var of its value (`KEY` → `API_KEY_HEADER`) */
export const HEADERS = new Map(
  [...STORES].map(([sName, { headers = {} }]) => [
    sName,
    Object.entries(headers).map(([sHeader, sValue]) => [
      sHeader,
      `API_${sValue.toUpperCase()}_HEADER`,
    ]),
  ]),
);

/** Pages of every `auth.routes`, in order, with the store and Better Auth's base path of each */
export const ROUTES: GuardedRoute[] = [...STORES].flatMap(([sName, { auth }]) =>
  (auth?.routes ?? []).map(({ match, redirect, roles, permissions }) => ({
    authPath: `/api/${sName}${auth?.path}`,
    match,
    redirect: redirect ?? DEFAULT_REDIRECT,
    roles: new Set(roles?.split(',')),
    permissions:
      permissions &&
      Object.fromEntries(
        Object.entries(permissions).map(([sResource, sActions]) => [
          sResource,
          sActions.split(','),
        ]),
      ),
  })),
);
