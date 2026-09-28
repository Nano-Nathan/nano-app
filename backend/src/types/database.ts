/** Database client configuration. */
export type DatabaseConfig = {
  /** Whether the database is enabled. Defaults to false */
  enabled?: boolean;
  /** Prisma schema file (`.prisma`), relative to `cwd` */
  schemaPath: string;
};
