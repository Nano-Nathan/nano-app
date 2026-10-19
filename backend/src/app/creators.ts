import type { PluginCallbacks, RouteEntry } from '@nano-app/core';
import NanoApp from './NanoApp';
import type { NanoAppConfig } from '../types/app';
import type { PluginConfig } from '../types/plugin';

/** Creates a new NanoApp instance */
export function createNanoApp(oConfig?: NanoAppConfig): NanoApp {
  return new NanoApp(oConfig);
}

/** Creates and types a route object. */
export function createRoute<DB>(oRoute: RouteEntry<DB>): RouteEntry<DB> {
  return oRoute;
}

/** Creates a plugin: a function of the plugin's own options that returns its configuration. */
type Creator<Options> = (options?: Options) => PluginConfig<Options>;
export function createPlugin<Options>(fnCreator: Creator<Options>): Creator<Options> {
  return fnCreator;
}

/** Creates and types the callbacks of a plugin. */
export function createPluginCallbacks<DB>(oCallbacks: PluginCallbacks<DB>): PluginCallbacks<DB> {
  return oCallbacks;
}
