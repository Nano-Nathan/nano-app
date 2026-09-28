import type { ApiResponse } from "../types/api";

export class Formatter {
  static price(value: number): string {
    return `$${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value || 0)}`;
  }

  static logDate(date: Date = new Date()): string {
    return new Intl.DateTimeFormat("es-ES", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }

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