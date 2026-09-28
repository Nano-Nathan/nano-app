import type { Request } from "express";
import { ApiPromise } from "./api";

/** Endpoint method: receives the request and, when the plugin has one, its Prisma client */
export type Handler = (req: Request, db?: any) => ApiPromise;

export type Handlers = {
  GET?: Handler;
  POST?: Handler;
  PUT?: Handler;
  DELETE?: Handler;
}

/** Entry of a route file (`*.route.ts`) */
export type RouteEntry = {
  expression?: string; // Support express route expressions
} & Handlers;

/** Entry of a store file (`*.store.ts`) */
export type StoreEntry<T = any> = {
  type: "app" | "api";
  path?: string;
  data?: NanoObject<T>;
};

/** Entry of a Prisma client file (`client.ts` or `client.js`)*/
export type PrismaEntry = new (options: { adapter: unknown }) => any;


/* Generic object */
export type NanoObject<T = any> = Record<string, T>;