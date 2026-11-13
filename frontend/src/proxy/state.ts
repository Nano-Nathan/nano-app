import { AUTH_PATH } from '@nano-app/core/const';
import { DEFAULT_REDIRECT } from '../const';
import Paths from '../utils/Paths';
import { STORES } from '../utils/state';
import { headerEnv } from './env';
import type { GuardedRoute } from '../types/proxy';

/** Headers the proxy adds per store, each with the env var of its value (`KEY` → `API_KEY_HEADER`) */
export const HEADERS = new Map(
  [...STORES].map(([sName, { headers = {} }]) => [
    sName,
    Object.entries(headers).map(([sHeader, sValue]) => [sHeader, headerEnv(sValue)]),
  ]),
);

/** Pages of every `auth.routes`, in order, with the store and Better Auth's base path of each */
export const ROUTES: GuardedRoute[] = [...STORES].flatMap(([sName, { auth }]) =>
  (auth?.routes ?? []).map(({ match, redirect, roles, permissions }) => ({
    authPath: `${Paths.store(sName)}${auth?.path ?? AUTH_PATH}`,
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
