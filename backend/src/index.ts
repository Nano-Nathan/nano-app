/** Application configuration and types */
export type { NanoAppConfig, PackagesConfig } from "./types/app";
export type { DatabaseConfig } from "./types/database";
export type { PluginConfig, PluginStage, MainPluginConfig } from "./types/plugin";

/** Re-exported Express type: the consumer does not need @types/express */
export type { Request } from "express";

/** HTTP contract */
export type { ApiPromise, ApiResponse, QueryParams, RouteEntry, Handler, Handlers, NanoObject } from "@nano-app/core";

/** Main class and creators */
export { NanoApp } from "./app/NanoApp";
export * from "./app/creators";
