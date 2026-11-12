import { Logger } from '@nano-app/core';
import { PRIVATE_NETWORKS } from '@nano-app/core/const';
import type { Request } from 'express';
import type { NanoObject } from '@nano-app/core';
import type { PackagesConfig } from '../types/app';

/** Application port */
export const PORT = 3000;

/** Folder of the app's routes */
export const ROUTES_DIR = 'src/routes';

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
