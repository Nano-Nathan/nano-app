import { FileLoader, Formatter, Validator, type NanoObject, type RouteEntry } from '@nano-app/core';
import Endpoint from './Endpoint';

/** Turns a folder of `*.route.ts` files into Express paths and endpoints */
export default class Router {
  private oRoutes: NanoObject<RouteEntry> = {};
  private sRoutesDir?: string;
  private sBasePath: string;

  constructor(sRoutesDir?: string, sBasePath?: string) {
    this.sRoutesDir = sRoutesDir;
    this.sBasePath = sBasePath ?? '';
  }

  /** Loads the routes and creates one endpoint per file */
  public async mount(): Promise<{ path: string; endpoint: Endpoint }[]> {
    // Loads the routes from the directory, when there is one, and drops the invalid ones
    if (this.sRoutesDir) {
      const oFiles = await FileLoader.findMany({ sourceDir: this.sRoutesDir, extension: 'route' });
      this.oRoutes = Validator.validate(oFiles, Validator.isRoute);
    }

    // Create the endpoints
    return Object.entries(this.oRoutes).map(
      ([sFilePath, { expression, callbacks, public: isPublic, permissions, ...methods }]) => {
        // Create the path of endpoints
        const sPath = this.createPath(sFilePath, expression);
        console.log(Formatter.message('INFO', `${sPath}`));

        // Create the endpoint
        return {
          path: sPath,
          endpoint: new Endpoint(methods, { callbacks, public: isPublic, permissions }),
        };
      },
    );
  }

  /** `basePath` + file path (`/index` is the folder itself) + `expression`, as Express reads them */
  private createPath(sEndpoint: string, sExpression: string = ''): string {
    return `${this.sBasePath}${sEndpoint.replace(/\/index$/, '')}${sExpression}` || '/';
  }
}
