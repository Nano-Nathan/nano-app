/** Kinds of file nano-app finds and validates */
export type FindableExtension = 'route' | 'prisma' | 'store';

/** Options of `FileLoader.findMany` */
export type FindOptions = {
  /** Extension of the files to find */
  extension: FindableExtension;
  /** Source directory. Defaults to `src/<extension>s` */
  sourceDir?: string;
};
