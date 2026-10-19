/** Options of the auth plugin */
export type AuthOptions = {
  /** Base path of the API key endpoints. Defaults to "/api-keys" */
  basePath?: string;
  /** Exact paths that need no API key, e.g. "/webhooks/telegram". Defaults to [] */
  publicPaths?: string[];
};

/** API key row, as the endpoints list it: the key itself is never stored */
export type ApiKey = {
  id: string;
  name: string;
  isMaster: boolean | null;
  createdAt: Date;
};
