import { FileLoader, type NanoObject, type RouteEntry } from "@nano-app/core";
import { Endpoint } from "./Endpoint";

export class Router {
  private routes: NanoObject<RouteEntry> = {};
  private routesDir?: string;
  private basePath: string;

  constructor(routesDir?: string, basePath?: string) {
    this.routesDir = routesDir;
    this.basePath = basePath ?? "";
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
    .map(([filePath, { expression, callbacks, ...methods }]) => {
      // Create the path of endpoints
      const path = this.createPath(filePath, expression);
      console.log(`[nano-app] [INFO] ${path}`);

      // Create the endpoint
      return { path, endpoint: new Endpoint(methods, callbacks) };
    })
  }

  /** `basePath` + file path (`/index` is the folder itself) + `expression`, as Express reads them */
  private createPath(endpoint: string, expression: string = ""): string {
    return `${this.basePath}${endpoint.replace(/\/index$/, "")}${expression}` || "/";
  }
}
