import { APP_NAME } from '@nano-app/core/const';
import Plugin from './Plugin';
import DatabaseManager from '../database/DatabaseManager';
import type { Express } from 'express';
import type { PluginManagerConfig } from '../types/plugin';

/** The plugins of the app: its own, the ones before it and the ones after it */
export default abstract class PluginManager {
  /** Mounts every plugin on express app, in order: before, the app's, after */
  public static async mount(oApp: Express, oConfig: PluginManagerConfig): Promise<void> {
    const { routesDir = 'src/routes', database, plugins } = oConfig;

    // The database of the app first, named as it: the plugins without their own share it
    await DatabaseManager.mount(APP_NAME, database);

    // The app's plugin and the ones around it, with the app's database unless they have one
    const oAppPlugin = new Plugin({ name: APP_NAME, routesDir, database });
    const aBefore = (plugins?.before ?? []).map(oPlugin => new Plugin({ database, ...oPlugin }));
    const aAfter = (plugins?.after ?? []).map(oPlugin => new Plugin({ database, ...oPlugin }));

    // Mounts them in order
    for (const oPlugin of [...aBefore, oAppPlugin, ...aAfter]) await oPlugin.mount(oApp);
  }
}
