import { defineConfig } from "tsup";
import { globSync } from "glob";

// One folder per plugin: `<name>/index.ts` is its import path (`@nano-app/plugins/<name>`)
const plugins = Object.fromEntries(
  globSync("*/index.ts", { ignore: ["node_modules/**", "build/**", "tests/**"] }).map(entry => [entry.replace(/\.ts$/, ""), entry]),
);

export default defineConfig({
  entry: {
    ...plugins,
    // Routes are loaded from `routesDir` at runtime, so each one is its own file
    ...Object.fromEntries(globSync("*/routes/**/*.route.ts").map(route => [route.replace(/\.ts$/, ""), route])),
  },
  format: ["esm"],
  dts: { entry: plugins },
  outDir: "build",
  clean: true,
  // Every entry is self-contained
  splitting: false,
  // The backend is a peer: the consumer's copy, never a bundled one
  external: ["@nano-app/backend"],
});
