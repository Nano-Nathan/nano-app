import type { ApiResponse } from '../types/api';

export default abstract class Formatter {
  /** Formats a price as `$1.234`, without decimals */
  public static price(iValue: number): string {
    return `$${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(iValue || 0)}`;
  }

  /** Message of anything thrown: its `message` when it has one, else the value itself */
  public static error(oError: unknown): string {
    return String((oError as { message?: unknown } | undefined)?.message ?? oError);
  }

  /** Formats a date for the request log: `dd/mm/yy, hh:mm:ss` */
  public static logDate(oDate: Date = new Date()): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(oDate);
  }

  // TODO: restore if responses must hide passwords; delete it otherwise
  // public static sanitizeAndParse(result: ApiResponse): ApiResponse {
  //   const jsonString = JSON.stringify(result);
  //   // The regular expression matches the key "password": "any_value"
  //   // where:
  //   //   - "password" is wrapped in quotes.
  //   //   - Optional spaces may surround the colon.
  //   //   - The value is assumed to be wrapped in quotes.
  //   const regex = /("password"\s*:\s*)"[^"]*"/gi;
  //   // Replace the value with the JSON literal null (unquoted)
  //   const sanitizedString = jsonString.replace(regex, '$1null');
  //   return JSON.parse(sanitizedString);
  // }
}
