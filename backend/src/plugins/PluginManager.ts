import { APP_NAME } from '@nano-app/core/const';
import Plugin from './Plugin';
import type { Mount } from '../types/app';
import type { PluginManagerConfig } from '../types/plugin';

/** The plugins of the app: its own, the ones before it and the ones after it */
export default abstract class PluginManager {
  /** The middlewares and endpoints of every plugin, in order: before, the app's, after */
  public static async build(oConfig: PluginManagerConfig): Promise<Mount[]> {
    const { routesDir = 'src/routes', database, plugins } = oConfig;

    // The app's plugin and the ones around it, with the app's database unless they have one
    const oAppPlugin = new Plugin({ name: APP_NAME, routesDir, database });
    const aBefore = (plugins?.before ?? []).map(oPlugin => new Plugin({ database, ...oPlugin }));
    const aAfter = (plugins?.after ?? []).map(oPlugin => new Plugin({ database, ...oPlugin }));

    // Builds them one by one, in order
    const aMounts: Mount[] = [];
    for (const oPlugin of [...aBefore, oAppPlugin, ...aAfter]) {
      aMounts.push(...(await oPlugin.build()));
    }
    return aMounts;
  }
}
