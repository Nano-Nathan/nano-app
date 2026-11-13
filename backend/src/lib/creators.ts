import NanoApp from '../app/NanoApp';
import type { NanoObject, PluginCallbacks, RouteEntry } from '@nano-app/core';
import type { NanoAppConfig } from '../types/app';
import type { PluginConfig } from '../types/plugin';

/** Creates a new NanoApp instance */
export function createNanoApp(oConfig?: NanoAppConfig): NanoApp {
  return new NanoApp(oConfig);
}

/** Creates a route object, typed with what the app injects in its params. */
export function createRoute<Deps = NanoObject<any>>(oRoute: RouteEntry<Deps>): RouteEntry<Deps> {
  return oRoute;
}

/** Creates a plugin: a function of the plugin's own options that returns its configuration. */
type Creator<Options> = (options?: Options) => PluginConfig<Options>;
export function createPlugin<Options>(fnCreator: Creator<Options>): Creator<Options> {
  return fnCreator;
}

/** Creates the callbacks of a plugin, typed with what it injects in its params. */
export function createPluginCallbacks<Deps = NanoObject<any>>(
  oCallbacks: PluginCallbacks<Deps>,
): PluginCallbacks<Deps> {
  return oCallbacks;
}
