import { FileLoader } from '@nano-app/core';
import Endpoint from './Endpoint';

/** Marks of the dynamic segments of a path, from the least to the most generic */
const MARKS = [':', '{', '*'];

/** Turns a folder of `*.route.ts` files into Express paths and endpoints */
export default class Router {
  private sRoutesDir?: string;
  private sBasePath: string;

  constructor(sRoutesDir?: string, sBasePath?: string) {
    this.sRoutesDir = sRoutesDir;
    this.sBasePath = sBasePath ?? '';
  }

  /** Loads the routes and creates one endpoint per file, the most specific path first */
  public async mount(): Promise<{ path: string; endpoint: Endpoint }[]> {
    // Without a directory there are no routes
    if (!this.sRoutesDir) return [];

    // Loads the routes of the directory; an invalid one throws
    const oRoutes = await FileLoader.findMany('route', this.sRoutesDir);

    // Creates the endpoints; Express answers with the first path that matches
    return Object.entries(oRoutes)
      .map(([sFilePath, { expression, ...oEndpointParams }]) => ({
        path: this.createPath(sFilePath, expression),
        endpoint: new Endpoint(oEndpointParams),
      }))
      .sort((oA, oB) => Router.specificity(oA.path).localeCompare(Router.specificity(oB.path)));
  }

  /** `basePath` + file path (`/index` is the folder itself) + `expression`, as Express reads them */
  private createPath(sEndpoint: string, sExpression: string = ''): string {
    return `${this.sBasePath}${sEndpoint.replace(/\/index$/, '')}${sExpression}` || '/';
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
