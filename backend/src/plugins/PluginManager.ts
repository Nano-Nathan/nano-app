import { APP_NAME } from '@nano-app/core/const';
import Drizzle from '../database/clients/Drizzle';
import Plugin from './Plugin';
import type { Mount } from '../types/app';
import type { PluginManagerConfig } from '../types/plugin';

/** The plugins of the app: its own, the ones before it and the ones after it */
export default abstract class PluginManager {
  /** The middlewares and endpoints of every plugin, in order: before, the app's, after */
  public static async build(oConfig: PluginManagerConfig): Promise<Mount[]> {
    const { routesDir = 'src/routes', database, plugins } = oConfig;

    // The app's database, named as it, unmounted: the plugins without their own share it
    const oAppDB = database && new Drizzle(APP_NAME, database);

    // The app's plugin and the ones around it
    const { before = [], after = [] } = plugins ?? {};
    const aPlugins = [...before, { name: APP_NAME, routesDir }, ...after];

    // Builds them one by one, in order
    const aMounts: Mount[] = [];
    for (const oPlugin of aPlugins) {
      aMounts.push(...(await new Plugin(oPlugin).build(oAppDB)));
    }
    return aMounts;
  }
}
