import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from './handlers/rateLimit';
import type { RequestHandler } from 'express';
import type { PackagesConfig } from '../types/app';

/** The base middlewares that are on, in the order the app uses them */
export default function packages(oConfig: PackagesConfig): RequestHandler[] {
  // Morgan, with its tokens
  if (oConfig.morgan) {
    for (const [sKey, fnToken] of Object.entries(oConfig.morgan.tokens ?? {})) {
      morgan.token(sKey, fnToken);
    }
  }

  // Every package in order, each only when it is on
  const aPackages = [
    oConfig.morgan && morgan(oConfig.morgan.format),
    oConfig.cors && cors(oConfig.cors),
    oConfig.helmet && helmet(),
    oConfig.rateLimit && rateLimit(oConfig.rateLimit),
    oConfig.compression && compression(),
    oConfig.express && express.json(oConfig.express),
    oConfig.urlencoded && express.urlencoded(oConfig.urlencoded),
  ];
  return aPackages.filter(fnPackage => typeof fnPackage === 'function');
}
