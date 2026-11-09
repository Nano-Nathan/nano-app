/** Paths of the app's pages */
export default abstract class Paths {
  /** Whether a path matches a pattern: exact (`/admin`), or the path and all below it (`/admin/*`) */
  public static matches(sPattern: string, sPath: string): boolean {
    // An exact pattern matches only its path
    if (!sPattern.endsWith('/*')) return sPattern === sPath;

    // A pattern ending in `/*` matches its base and every path below it
    const sBase = sPattern.slice(0, -2);
    return sPath === sBase || sPath.startsWith(`${sBase}/`);
  }
}
