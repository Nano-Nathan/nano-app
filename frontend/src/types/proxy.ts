import type { NanoObject } from '@nano-app/core/types/objects';

/** Backend of a store, as the proxy reads it from the env: its URL and headers, or the env var that is missing */
export type ProxyTarget = { url: string; headers: NanoObject<string> } | { missing: string };
