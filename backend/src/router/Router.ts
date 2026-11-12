import { FileLoader, Logger, Validator } from '@nano-app/core';
import { ROUTE } from '@nano-app/core/utils/validations';
import Endpoint from './Endpoint';
import AuthEndpoint from './AuthEndpoint';
import BetterAuth from '../auth/BetterAuth';

/** Turns a folder of `*.route.ts` files into Express paths and endpoints */
export default class Router {
  private sRoutesDir?: string;
  private sBasePath: string;

  constructor(sRoutesDir?: string, sBasePath?: string) {
    this.sRoutesDir = sRoutesDir;
    this.sBasePath = sBasePath ?? '';
  }

  /** Loads the routes and creates one endpoint per file */
  public async mount(): Promise<{ path: string; endpoint: Endpoint }[]> {
    // Without a directory there are no routes
    if (!this.sRoutesDir) return [];

    // Loads the routes of the directory; an invalid one throws
    const oFiles = await FileLoader.findMany('route', this.sRoutesDir);
    const oRoutes = Validator.validate(oFiles, ROUTE);

    // Create the endpoints
    return Object.entries(oRoutes).map(
      ([sFilePath, { expression, callbacks, public: isPublic, permissions, ...methods }]) => {
        // Create the path of endpoints
        const sPath = this.createPath(sFilePath, expression);
        Logger.info(sPath);

        // Create the endpoint, behind Better Auth when it is on
        const oOptions = { callbacks, public: isPublic, permissions };
        const oEndpoint = BetterAuth.instance()
          ? new AuthEndpoint(methods, oOptions)
          : new Endpoint(methods, oOptions);
        return { path: sPath, endpoint: oEndpoint };
      },
    );
  }

  /** `basePath` + file path (`/index` is the folder itself) + `expression`, as Express reads them */
  private createPath(sEndpoint: string, sExpression: string = ''): string {
    return `${this.sBasePath}${sEndpoint.replace(/\/index$/, '')}${sExpression}` || '/';
  }
}
