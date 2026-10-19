import { FileLoader, type NanoObject, type RouteEntry } from '@nano-app/core';
import Endpoint from './Endpoint';

export default class Router {
  private oRoutes: NanoObject<RouteEntry> = {};
  private sRoutesDir?: string;
  private sBasePath: string;

  constructor(sRoutesDir?: string, sBasePath?: string) {
    this.sRoutesDir = sRoutesDir;
    this.sBasePath = sBasePath ?? '';
  }

  public async mount(): Promise<{ path: string; endpoint: Endpoint }[]> {
    // Load ther routes from the directory if needed
    if (!!this.sRoutesDir) {
      this.oRoutes = await FileLoader.findMany<RouteEntry>({
        sourceDir: this.sRoutesDir,
        extension: 'route',
      });
    }

    // Create the endpoints
    return Object.entries(this.oRoutes).map(
      ([sFilePath, { expression, callbacks, ...methods }]) => {
        // Create the path of endpoints
        const sPath = this.createPath(sFilePath, expression);
        console.log(`[nano-app] [INFO] ${sPath}`);

        // Create the endpoint
        return { path: sPath, endpoint: new Endpoint(methods, callbacks) };
      },
    );
  }

  /** `basePath` + file path (`/index` is the folder itself) + `expression`, as Express reads them */
  private createPath(sEndpoint: string, sExpression: string = ''): string {
    return `${this.sBasePath}${sEndpoint.replace(/\/index$/, '')}${sExpression}` || '/';
  }
}
