/** Messages of the framework on the console */
export default abstract class Logger {
  /** Message of the framework: `[nano-app] [<level>] <text>` */
  public static message(sLevel: 'ERROR' | 'WARNING' | 'INFO', sText: string): string {
    return `[nano-app] [${sLevel}] ${sText}`;
  }

  /** `[nano-app] [ERROR] <text>`, with what was thrown */
  public static error(sText: string, oError: unknown): void {
    console.error(Logger.message('ERROR', sText), oError);
  }

  /** `[nano-app] [WARNING] <text>`; returns `false`, to discard what it warns about */
  public static warn(sText: string): false {
    console.warn(Logger.message('WARNING', sText));
    return false;
  }

  /** `[nano-app] [INFO] <text>` */
  public static info(sText: string): void {
    console.log(Logger.message('INFO', sText));
  }

  /** Date of the request log, in UTC: `2026-10-19 12:03:10` */
  public static date(oDate: Date = new Date()): string {
    return oDate.toISOString().slice(0, 19).replace('T', ' ');
  }
}
