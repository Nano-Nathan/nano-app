import FileLoader from '@nano-app/core/files/FileLoader';
import Logger from '@nano-app/core/utils/Logger';
import { STORE } from '../utils/validations';
import type { NanoAppConfig as BackendConfig } from '@nano-app/backend';
import type { StoreFiles } from '../types/store';
import type { NanoAppConfig } from '../types/app';

/** Main NanoApp class of the frontend: a NanoApp of the backend with the proxy and React Router */
export default class NanoApp {
  protected oConfig: NanoAppConfig;

  constructor(oConfig: NanoAppConfig = {}) {
    this.oConfig = oConfig;
    this.start();
  }

  /** Starts the application: the backend's NanoApp, set up as a frontend */
  private async start(): Promise<void> {
    try {
      // The backend is Node only: imported when it starts
      const { NanoApp: BackendApp } = await import('@nano-app/backend');
      new BackendApp(await this.initialize());
    } catch (oError) {
      Logger.error('Error trying to start the frontend.', oError);
      process.exit(1);
    }
  }

  /** The backend's config: the stores of the app, the proxy before and React Router after */
  private async initialize(): Promise<BackendConfig> {
    // The app's stores, validated; an invalid one stops the startup
    const oFiles = await FileLoader.findMany('store', STORE);
    const stores: StoreFiles = Object.fromEntries(
      Object.entries(oFiles).map(([sPath, oStore]) => [
        sPath.slice(1).replaceAll('/', '_'),
        oStore,
      ]),
    );

    // Its plugins, with the stores
    const { default: proxy } = await import('./proxy');
    const { default: frontend } = await import('./frontend');

    // The body goes to the backend as it came, and React Router sets its own headers
    const { packages } = this.oConfig;
    return {
      ...this.oConfig,
      packages: { express: false, urlencoded: false, helmet: false, ...packages },
      plugins: { before: [proxy({ stores })], after: [frontend({ stores })] },
    };
  }
}
