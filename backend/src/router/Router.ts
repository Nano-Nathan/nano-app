import { FileLoader, Validator } from '@nano-app/core';
import Endpoint from './Endpoint';
import type { NanoObject, RouteEntry } from '@nano-app/core';

/** Marks of the dynamic segments of a path, from the least to the most generic */
const MARKS = [':', '{', '*'];

/** Turns a folder of `*.route.ts` files and routes made in code into Express paths and endpoints */
export default class Router {
  private sRoutesDir?: string;
  private sBasePath: string;
  private oRoutes: NanoObject<RouteEntry<any>>;

  constructor(sRoutesDir?: string, sBasePath?: string, oRoutes?: NanoObject<RouteEntry<any>>) {
    this.sRoutesDir = sRoutesDir;
    this.sBasePath = sBasePath ?? '';
    this.oRoutes = oRoutes ?? {};
  }

  /** Loads the routes and creates one endpoint per route, the most specific path first */
  public async load(): Promise<{ path: string; endpoint: Endpoint }[]> {
    // Loads the routes of the directory, when it has one; an invalid one throws
    const oRoutes = this.sRoutesDir ? await FileLoader.findMany('route', this.sRoutesDir) : {};

    // Validates the routes made in code as the files
    for (const [sPath, oRoute] of Object.entries(this.oRoutes)) {
      oRoutes[sPath] = Validator.validate('route', oRoute, sPath);
    }

    // Creates the endpoints; Express answers with the first path that matches
    return Object.entries(oRoutes)
      .map(([sFilePath, { expression = '', ...oEndpointParams }]) => ({
        path: `${this.sBasePath}${sFilePath.replace(/\/index$/, '')}${expression}` || '/',
        endpoint: new Endpoint(oEndpointParams),
      }))
      .sort((oA, oB) => Router.specificity(oA.path).localeCompare(Router.specificity(oB.path)));
  }

  /** One digit per segment: 0 static, 1 `:param`, 2 `{optional}`, 3 `*wildcard` */
  private static specificity(sPath: string): string {
    return sPath
      .split('/')
      .map(sSegment =>
        MARKS.reduce((iRank, sMark, iIndex) => (sSegment.includes(sMark) ? iIndex + 1 : iRank), 0),
      )
      .join('');
  }
}
