import NanoApp from '../app/NanoApp';
import type { NanoObject } from '@nano-app/core';
import type { NanoAppConfig } from '../types/app';
import type { PluginConfig, PluginOptions } from '../types/plugin';
import type { PluginCallbacks, RouteEntry } from '../types/route';

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
export function createPlugin<Options extends NanoObject = NanoObject>(
  fnCreator: Creator<Options>,
): (options?: Options & PluginOptions) => PluginConfig<Options> {
  return options => {
    // The consumer's basePath over the plugin's
    const oConfig = fnCreator(options);
    return { ...oConfig, basePath: options?.basePath ?? oConfig.basePath };
  };
}

/** Creates the callbacks of a plugin, typed with what it injects in its params. */
export function createPluginCallbacks<Deps = NanoObject<any>>(
  oCallbacks: PluginCallbacks<Deps>,
): PluginCallbacks<Deps> {
  return oCallbacks;
}
