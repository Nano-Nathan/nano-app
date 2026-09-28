import { FileLoader, type NanoObject, type RouteEntry } from "@nano-app/core";
import { Endpoint } from "./Endpoint";

export class Router {
  private routes: NanoObject<RouteEntry> = {};
  private routesDir?: string;
  private basePath: string;

  constructor(routesDir?: string, basePath?: string) {
    this.routesDir = routesDir;
    this.basePath = basePath ?? "/";
  }

  async mount(): Promise<{ path: string, endpoint: Endpoint }[]> {
    // Load ther routes from the directory if needed
    if (!!this.routesDir) {
      this.routes = await FileLoader.findMany<RouteEntry>({
        sourceDir: this.routesDir,
        extension: "route",
      });
    }

    // Create the endpoints
    return Object.entries(this.routes)
    .map(([filePath, { expression, ...methods }]) => {
      // Create the path of endpoints
      const path = this.createPath(filePath, expression);
      console.log(`[nano-app] [INFO] ${path}`);

      // Create the endpoint
      return { path, endpoint: new Endpoint(methods) };
    })
  }

  private createPath (endpoint: string, expression?: string): string {
    // A endpoint of /index becomes /
    const isIndex = endpoint === '/index'
    let path = isIndex ? '/' : endpoint;

    // With an expression, appends it
    if (!!expression) {
      path = `${isIndex ? '' : endpoint.replace(/\/+$/, "")}/${expression.replace(/^\/+/, "")}`
    }

    // If has basePath, append it
    const basePath = this.basePath.replace(/\/+$/, "")
    if (basePath) {
      path = path === "/" ? basePath : `${basePath}${path}`;
    }

    return path;
  }
}