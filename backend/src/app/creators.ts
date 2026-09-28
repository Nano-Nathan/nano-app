import type { RouteEntry } from "@nano-app/core";
import { NanoApp } from "./NanoApp";
import type { NanoAppConfig } from "../types/app";
import type { PluginConfig } from "../types/plugin";

/** Creates a new NanoApp instance */
export function createNanoApp(config?: NanoAppConfig): NanoApp {
  return new NanoApp(config);
}

/** Creates and types a route object. */
export function createRoute(route: RouteEntry): RouteEntry {
  return route;
}

/** Creates a plugin: a function of the plugin's own options that returns its configuration. */
type Creator<Options> = (options?: Options) => PluginConfig;
export function createPlugin<Options>(creator: Creator<Options>): Creator<Options> {
  return creator;
}
