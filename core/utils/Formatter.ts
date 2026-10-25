/** Formats values for logs and messages */
export default abstract class Formatter {
  /** Message of anything thrown: its `message` when it has one, else the value itself */
  public static error(oError: unknown): string {
    // An object with a `message`: its message
    if (oError && typeof oError === 'object' && 'message' in oError) {
      return String(oError.message ?? oError);
    }

    // Anything else: the value itself
    return String(oError);
  }

  /** Formats a date for the request log, in UTC: `2026-10-19 12:03:10` */
  public static logDate(oDate: Date = new Date()): string {
    return oDate.toISOString().slice(0, 19).replace('T', ' ');
  }
}
