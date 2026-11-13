import { Logger } from '@nano-app/core';
import type { Request } from 'express';
import type { NanoObject } from '@nano-app/core';
import type { PackagesConfig } from './types/app';

/** Loopback and private networks: the proxies the backend trusts by default */
export const PRIVATE_NETWORKS = [
  '127.0.0.0/8',
  '::1/128',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  'fc00::/7',
];

/** Application port */
export const PORT = 3000;

/** Express settings: the client IP comes from `X-Forwarded-For` only through private proxies */
export const SETTINGS: NanoObject<unknown> = {
  'trust proxy': PRIVATE_NETWORKS,
};

/** Base middlewares */
export const PACKAGES: PackagesConfig = {
  morgan: {
    tokens: {
      timestamp: () => Logger.date(),
      path: (oReq: Request) => oReq.path,
    },
    format: ':timestamp | :method :path :status',
  },
  cors: {
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'QUERY'],
  },
  helmet: true,
  compression: false,
  express: {
    limit: '10kb',
  },
  urlencoded: {
    extended: false,
  },
};

/** Key of the Postgres lock that lets one startup change the database at a time */
export const LOCK = 7_310_002;

/** Name of Better Auth's database: its tables live in `nano_auth` */
export const AUTH_NAME = 'auth';

/** Marks of the dynamic segments of a path, from the least to the most generic */
export const MARKS = [':', '{', '*'];
