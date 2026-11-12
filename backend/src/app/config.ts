import { Logger, NanoObject } from '@nano-app/core';
import { PRIVATE_NETWORKS } from '@nano-app/core/const';
import type { Request } from 'express';
import type { PackagesConfig } from '../types/app';
import type { PluginConfig } from '../types/plugin';

/** Packages configuration */
export const PACKAGES_CONFIG: PackagesConfig = {
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

/** Express settings */
export const EXPRESS_CONFIG: NanoObject<unknown> = {
  'trust proxy': PRIVATE_NETWORKS,
};

/** Plugins configuration */
export const PLUGINS_CONFIG: NanoObject<PluginConfig[]> = {
  before: [],
  after: [],
};

/** Routes directory */
export const ROUTES_DIR = 'src/routes';

/** Application port */
export const PORT = 3000;
