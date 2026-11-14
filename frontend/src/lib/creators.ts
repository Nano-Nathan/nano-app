import NanoApp from '../app/NanoApp';
import type { NanoAppConfig } from '../types/app';

/** Creates a new NanoApp instance */
export function createNanoApp(oConfig?: NanoAppConfig): NanoApp {
  return new NanoApp(oConfig);
}
