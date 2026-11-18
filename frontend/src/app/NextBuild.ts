import { writeFile } from 'node:fs/promises';
import FileLoader from '@nano-app/core/files/FileLoader';
import TEXTS from '@nano-app/core/i18n';
import { API_STORE_TYPE, APP_NAME } from '@nano-app/core/const';
import NanoError from '@nano-app/core/utils/NanoError';
import { API_NAME, APP_STORE_TYPE, STORE_CLASSES, TYPES_FILE } from '../const';
import { I18N, STORE } from '../utils/validations';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { StoreFile } from '../types/store';

/** What `withNanoApp` reads and writes of the app while Next reads `next.config.ts`. Node only */
export default abstract class NextBuild {
  /** The app's stores by name, its path with `_` for `/`, with the app and api stores always there */
  public static async stores(): Promise<[string, StoreFile][]> {
    // Finds and validates the app's `src/stores/**/*.store.ts`
    const oFiles = await FileLoader.findMany('store', STORE);

    // The api store is an api store also when the app has a file for it
    if (oFiles[`/${API_NAME}`] && oFiles[`/${API_NAME}`].type !== API_STORE_TYPE)
      throw new NanoError(
        `src/stores/${API_NAME}.store.ts must have type '${API_STORE_TYPE}': the ${API_NAME} store reads the backend of API_API_URL. Rename the file to keep UI state.`,
      );

    // The app store with the texts at /i18n
    const oApp: StoreFile = oFiles[`/${APP_NAME}`] ?? { type: APP_STORE_TYPE };
    const oStores: NanoObject<StoreFile> = {
      [`/${API_NAME}`]: { type: API_STORE_TYPE },
      ...oFiles,
      [`/${APP_NAME}`]: { ...oApp, data: { ...oApp.data, i18n: await NextBuild.texts() } },
    };

    return Object.entries(oStores).map(([sPath, oStore]): [string, StoreFile] => [
      sPath.slice(1).replaceAll('/', '_'),
      oStore,
    ]);
  }

  /** The texts of each locale of the framework and of `src/i18n/*.i18n.ts`, each key of the app over the framework's */
  public static async texts(): Promise<NanoObject<NanoObject<string>>> {
    // The app's texts by locale, the file name without its path
    const oI18n = await FileLoader.findMany('i18n', I18N, 'src/i18n');
    const oApp: NanoObject<NanoObject<string>> = Object.fromEntries(
      Object.entries(oI18n).map(([sPath, oLocale]) => [sPath.slice(1), oLocale]),
    );

    // Each locale of either, the app's keys over the framework's
    const oFramework: NanoObject<NanoObject<string>> = TEXTS;
    const aLocales = [...new Set([...Object.keys(oFramework), ...Object.keys(oApp)])];
    return Object.fromEntries(
      aLocales.map(sLocale => [sLocale, { ...oFramework[sLocale], ...oApp[sLocale] }]),
    );
  }

  /** Each api store with the env var of its backend URL, for the proxy */
  public static backends(aStores: [string, StoreFile][]): [string, string][] {
    return aStores
      .filter(([, { type }]) => type === API_STORE_TYPE)
      .map(([sName]) => [sName, `API_${sName.toUpperCase()}_URL`]);
  }

  /** Writes the type of each store but `app` and `api`, which `Stores` always has */
  public static async writeTypes(aStores: [string, StoreFile][]): Promise<void> {
    const aTypes = aStores
      .filter(([sName]) => sName !== APP_NAME && sName !== API_NAME)
      .map(
        ([sName, { type }]) =>
          `    ${JSON.stringify(sName)}: import('@nano-app/frontend').${STORE_CLASSES[type]};`,
      );
    await writeFile(
      TYPES_FILE,
      [
        '// Written by withNanoApp from src/stores. Do not edit.',
        'export {};',
        "declare module '@nano-app/frontend' {",
        '  interface Stores {',
        ...aTypes,
        '  }',
        '}',
        '',
      ].join('\n'),
    );
  }
}
