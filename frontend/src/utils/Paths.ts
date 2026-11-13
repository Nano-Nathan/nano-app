import { DEFAULT_STORE } from '@nano-app/core/const';
import { PROXY_PATH } from '../const';

/** Paths of the app: its pages and the proxy of its stores */
export default abstract class Paths {
  /** Path of a store in the proxy: `/api` for the default one, `/api/<store>` for the rest */
  public static store(sName: string): string {
    return sName === DEFAULT_STORE ? PROXY_PATH : `${PROXY_PATH}/${sName}`;
  }

  /** Whether a path matches a pattern: exact (`/admin`), or the path and all below it (`/admin/*`) */
  public static matches(sPattern: string, sPath: string): boolean {
    // An exact pattern matches only its path
    if (!sPattern.endsWith('/*')) return sPattern === sPath;

    // A pattern ending in `/*` matches its base and every path below it
    const sBase = sPattern.slice(0, -2);
    return sPath === sBase || sPath.startsWith(`${sBase}/`);
  }
}
