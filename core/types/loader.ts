export type FindableExtension = 'store' | 'route' | 'prisma';

export type FindOptions = {
  /** Extension of the files to find */
  extension: FindableExtension;
  /** Source directory. Defaults to `src/<extension>s` */
  sourceDir?: string;
  /** Whether to save the result to a file */
  save?: boolean;
  /** Output directory */
  savePath?: string;
}
