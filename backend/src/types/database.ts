/** What `generate` remembers of a client: the schema it came from and its hash */
export type ClientSource = { schemaPath: string; hash: string };

/** The fields of a `package.json` that the database reads */
export type PackageJson = { name?: string };

/** Database client configuration. */
export type DatabaseConfig = {
  /** Whether the database is enabled. Defaults to false */
  enabled?: boolean;
  /** Prisma schema file (`.prisma`), relative to `cwd` */
  schemaPath: string;
};
