// `import.meta.glob` of Turbopack (Next >= 16.3), the Vite-compatible API. Only its eager form is typed
declare global {
  // interface: `ImportMeta` is a global interface, extended by merging
  interface ImportMeta {
    /** Imports every module matching the pattern, keyed by its path from the project root */
    glob<T>(sPattern: string, oOptions: { eager: true }): Record<string, T>;
  }
}

export {};
