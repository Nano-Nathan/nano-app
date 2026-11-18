#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Logger from '@nano-app/core/utils/Logger';
import NanoError from '@nano-app/core/utils/NanoError';

/** Folder of the template, beside this file in the package */
const TEMPLATE = fileURLToPath(new URL('./template', import.meta.url));

/** A name npm accepts for a package: lowercase, digits, `.`, `_` and `-` */
const NAME = /^[a-z0-9][a-z0-9._-]*$/;

// The name of the app, the first argument: also its folder
const [sName] = process.argv.slice(2);
if (!sName || !NAME.test(sName))
  throw new NanoError(
    'Give the name of the app, in lowercase, digits, ".", "_" and "-": `pnpm create @nano-app my-app`.',
  );

// Its folder must not exist
const sDir = resolve(sName);
if (existsSync(sDir))
  throw new NanoError(`The folder ${sName} already exists: choose another name or remove it.`);

// The template, with its .gitignore back
cpSync(TEMPLATE, sDir, { recursive: true });
renameSync(join(sDir, 'gitignore'), join(sDir, '.gitignore'));

// The name of the app in its package.json
const sPackage = join(sDir, 'package.json');
const oPackage = JSON.parse(readFileSync(sPackage, 'utf8'));
writeFileSync(sPackage, `${JSON.stringify({ ...oPackage, name: sName }, null, 2)}\n`);

Logger.info(
  `${sName} created. Next: cd ${sName}, pnpm install, cp .env.example .env and pnpm dev.`,
);
