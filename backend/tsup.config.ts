import { defineConfig } from "tsup";
import { cpSync, existsSync } from "fs";
import { globSync } from "glob";
import pkg from "./package.json";

// Official plugins are optional. This tree ships none; a plugins/index.ts turns the export on.
const pluginEntry = existsSync("plugins/index.ts") ? { plugins: "plugins/index.ts" } : {};

export default defineConfig({
  // Entries using BASE_DIR sit at the build root, like const.ts at the package root
  entry: {
    index: "src/index.ts",
    "nano-app": "bin/nano-app.ts",
    ...pluginEntry,
    ...Object.fromEntries(globSync("plugins/*/routes/**/*.route.ts").map(route => [route.replace(/\.ts$/, ""), route])),
  },
  format: ["esm"],
  dts: { entry: { index: "src/index.ts", ...pluginEntry } },
  outDir: "build",
  clean: true,
  // Every entry is self-contained
  splitting: false,
  // Dependencies and optional peers (the Prisma stack) stay out of the bundle
  external: [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})],
  // Plugins' schemas travel with the build: `nano-app generate` and `push` read them from there
  onSuccess: async () => {
    for (const schema of globSync("plugins/*/schema.prisma")) cpSync(schema, `build/${schema}`);
  },
});
