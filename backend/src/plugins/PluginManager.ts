import { APP_NAME } from '@nano-app/core/const';
import Plugin from './Plugin';
import type { Express } from 'express';
import type { PluginManagerConfig } from '../types/plugin';

/** The plugins of the app: its own, the ones before it and the ones after it */
export default class PluginManager {
  private oConfig: PluginManagerConfig;

  /** Creates a new PluginManager instance */
  constructor(oConfig: PluginManagerConfig) {
    this.oConfig = oConfig;
  }

  /** Mounts every plugin on express app, in order: before, the app's, after */
  public async mount(oApp: Express): Promise<void> {
    const { routesDir = 'src/routes', database, plugins, auth } = this.oConfig;

    // The app's plugin; the others without a database get the app's config
    const oAppPlugin = new Plugin({ name: APP_NAME, routesDir, database });
    const aBefore = (plugins?.before ?? []).map(oPlugin => new Plugin({ database, ...oPlugin }));
    const aAfter = (plugins?.after ?? []).map(oPlugin => new Plugin({ database, ...oPlugin }));

    // Mounts them in order
    for (const oPlugin of [...aBefore, oAppPlugin, ...aAfter]) {
      await oPlugin.mount(oApp);
    }
  }
}
