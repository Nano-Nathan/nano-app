import type { NanoObject } from '@nano-app/core/types/objects';
import type { ProxyTarget } from '../types/proxy';
import type { StoreFiles } from '../types/store';

/** Backends of the stores, read from the env once per server start */
export default abstract class ProxyEnv {
  private static oTargets?: NanoObject<ProxyTarget>;

  /** Backend of a store (`admin_users`): read on the first request, then reused */
  public static resolve(sName: string): ProxyTarget {
    // Reads the env the first time
    this.oTargets ??= this.load();

    // A store without its URL names the variable to define
    const sKey = sName.toUpperCase();
    return this.oTargets[sKey] ?? { missing: `API_${sKey}_URL` };
  }

  /** Every `API_<NAME>_URL` of the env, with the headers its store declares */
  private static load(): NanoObject<ProxyTarget> {
    // `process.env.NANO_APP_STORES` stays literal so Next can replace it
    const oFiles: StoreFiles = JSON.parse(process.env.NANO_APP_STORES ?? '{}');

    // Indexes the headers of each store by the name of its env vars
    const oHeaders: NanoObject<NanoObject<string>> = Object.fromEntries(
      Object.entries(oFiles).map(([sName, oFile]) => [sName.toUpperCase(), oFile.headers ?? {}]),
    );

    // Pairs each backend URL with its store's headers
    const oTargets: NanoObject<ProxyTarget> = {};
    for (const [sEnvName, sUrl] of Object.entries(process.env)) {
      const sKey = sEnvName.match(/^API_(.+)_URL$/)?.[1];
      if (sKey && sUrl) oTargets[sKey] = this.target(sUrl, oHeaders[sKey] ?? {});
    }

    return oTargets;
  }

  /** A backend with the value of each header (`STRIPE_KEY` → `API_STRIPE_KEY_HEADER`) */
  private static target(sUrl: string, oNames: NanoObject<string>): ProxyTarget {
    // Reads the env var of each header
    const oValues: NanoObject<string> = {};
    for (const [sHeader, sName] of Object.entries(oNames)) {
      const sEnvName = `API_${sName.toUpperCase()}_HEADER`;
      const sValue = process.env[sEnvName];
      if (!sValue) return { missing: sEnvName };
      oValues[sHeader] = sValue;
    }

    return { url: sUrl, headers: oValues };
  }
}
