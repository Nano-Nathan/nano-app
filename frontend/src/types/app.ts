import type { ServerConfig } from '@nano-app/backend';

/** What the frontend's NanoApp reads: the server of the backend, without Better Auth */
export type NanoAppConfig = Omit<ServerConfig, 'auth'>;
