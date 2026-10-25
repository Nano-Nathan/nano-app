import NanoApp from './NanoApp';
import type { PluginCallbacks, RouteEntry } from '@nano-app/core';
import type { NanoAppConfig } from '../types/app';
import type { PluginCreator } from '../types/plugin';

/** Creates a new NanoApp instance */
export function createNanoApp(oConfig?: NanoAppConfig): NanoApp {
  return new NanoApp(oConfig);
}

/** Creates and types a route object. */
export function createRoute<DB>(oRoute: RouteEntry<DB>): RouteEntry<DB> {
  return oRoute;
}

/** Creates a plugin: a function of the plugin's own options that returns its configuration. */
export function createPlugin<Options>(fnCreator: PluginCreator<Options>): PluginCreator<Options> {
  return fnCreator;
}

/** Creates and types the callbacks of a plugin. */
export function createPluginCallbacks<DB>(oCallbacks: PluginCallbacks<DB>): PluginCallbacks<DB> {
  return oCallbacks;
}
