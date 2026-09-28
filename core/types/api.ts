import type { NanoObject } from "./objects";

/** API response */
export type ApiResponse<T = any> = {
  success?: boolean
  result?: T
  message?: string
  warning?: boolean
}

export type ApiPromise<T = any> = Promise<{
  success?: boolean
  result?: T
  message?: string
  warning?: boolean
}>

/** Query parameters sent in the `query` header (JSON). */
export type QueryParams = {
  skip?: number;
  top?: number;
  filter?: NanoObject;
  orderby?: Record<string, "asc" | "desc">;
  select?: string;
};
