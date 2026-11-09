import Formatter from './Formatter';

/** Messages of the framework on the console */
export default abstract class Logger {
  /** `[nano-app] [ERROR] <text>`, with what was thrown */
  public static error(sText: string, oError: unknown): void {
    console.error(Formatter.message('ERROR', sText), oError);
  }

  /** `[nano-app] [WARNING] <text>`; returns `false`, to discard what it warns about */
  public static warn(sText: string): false {
    console.warn(Formatter.message('WARNING', sText));
    return false;
  }

  /** `[nano-app] [INFO] <text>` */
  public static info(sText: string): void {
    console.log(Formatter.message('INFO', sText));
  }
}
