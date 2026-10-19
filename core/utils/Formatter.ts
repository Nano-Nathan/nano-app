/** Formats values for logs and messages */
export default abstract class Formatter {
  /** Message of anything thrown: its `message` when it has one, else the value itself */
  public static error(oError: unknown): string {
    return String((oError as { message?: unknown } | undefined)?.message ?? oError);
  }

  /** Formats a date for the request log, in UTC: `2026-10-19 12:03:10` */
  public static logDate(oDate: Date = new Date()): string {
    return oDate.toISOString().slice(0, 19).replace('T', ' ');
  }
}
