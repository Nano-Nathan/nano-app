import { NanoError, NanoObject } from '@nano-app/core';
import { APP_NAME } from '@nano-app/core/const';
import Plugin from './Plugin';
import type { Express } from 'express';
import type { AuthOptions } from '../types/app';
import type { PluginConfig, PluginManagerConfig } from '../types/plugin';

/** The plugins of the app: its own, the ones before it and the ones after it */
export default class PluginManager {
  protected aPlugins: Plugin[] = [];
  private oAuthOptions?: AuthOptions;

  /** Creates a new PluginManager instance */
  constructor({
    routesDir,
    database,
    auth,
    plugins_before = [],
    plugins_after = [],
  }: PluginManagerConfig) {
    const oPlugins: NanoObject<PluginConfig> = {};

    // Better Auth keeps its tables in the app's database
    if (auth && !database) {
      throw new NanoError('auth needs the database of the app: set database.schema in createNanoApp.');
    }
    this.oAuthOptions = auth;
    
    // Validate before plugins
    for (const oPlugin of plugins_before) {
      if (oPlugin.name in oPlugins) {
        throw new NanoError(`The plugin "${oPlugin.name}" is already defined.`);
      }
      oPlugins[oPlugin.name] = oPlugin;
      this.aPlugins.push(new Plugin(oPlugin));
    }
    
    // Creates the app plugin
    this.aPlugins.push(new Plugin({ name: APP_NAME, routesDir, database }));

    // Validate after plugins
    for (const oPlugin of plugins_after) {
      if (oPlugin.name in oPlugins) {
        throw new NanoError(`The plugin "${oPlugin.name}" is already defined.`);
      }
      oPlugins[oPlugin.name] = oPlugin;
      this.aPlugins.push(new Plugin(oPlugin));
    }
  }

  /** Mounts every plugin on express app, in order: before, the app's, after */
  public async mount(oApp: Express): Promise<void> {
    // The app's client first: a plugin without its own database gets it
    const aPlugins = aConfigs.map(oPlugin => new Plugin(oPlugin));
    const oAppPlugin = aPlugins[aBefore.length];
    const db = await oAppPlugin.client();

    // Mounts them in order; only the app's gets Better Auth
    for (const oPlugin of aPlugins) {
      const oContext = oPlugin === oAppPlugin ? { db, authOptions: this.oAuthOptions } : { db };
      await oPlugin.mount(oApp, oContext);
    }
  }
}
