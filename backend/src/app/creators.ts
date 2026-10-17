import type { PluginCallbacks, RouteEntry } from "@nano-app/core";
import { NanoApp } from "./NanoApp";
import type { NanoAppConfig } from "../types/app";
import type { PluginConfig } from "../types/plugin";

/** Creates a new NanoApp instance */
export function createNanoApp(config?: NanoAppConfig): NanoApp {
  return new NanoApp(config);
}

/** Creates and types a route object. */
export function createRoute<DB>(route: RouteEntry<DB>): RouteEntry<DB> {
  return route;
}

/** Creates a plugin: a function of the plugin's own options that returns its configuration. */
type Creator<Options> = (options?: Options) => PluginConfig<Options>;
export function createPlugin<Options>(creator: Creator<Options>): Creator<Options> {
  return creator;
}

/** Creates and types the callbacks of a plugin. */
export function createPluginCallbacks<DB>(callbacks: PluginCallbacks<DB>): PluginCallbacks<DB> {
  return callbacks;
}
