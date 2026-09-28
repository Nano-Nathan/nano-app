#!/usr/bin/env node
import "dotenv/config";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { getDir } from "../const";

/**
 * Prisma wrapper: clients are generated in .nano-app/prisma-clients/<name> ("app" is the project's schema).
 *   nano-app generate [name...] [--schema <path>]
 *   nano-app push [name...] [--schema <path>] [prisma flags, e.g. --accept-data-loss]
 *   nano-app <any other Prisma command>
 */
const [command, ...args] = process.argv.slice(2);

const prisma = (...prismaArgs: string[]) =>
  execFileSync(process.execPath, [createRequire(`${process.cwd()}/`).resolve("prisma/build/index.js"), ...prismaArgs], { stdio: "inherit" });

try {
  if (command !== "generate" && command !== "push") {
    prisma(...process.argv.slice(2));
  } else {
    const schemaFlag = args.indexOf("--schema");
    const appSchema = schemaFlag >= 0 ? args.splice(schemaFlag, 2)[1] : "src/prisma/schema.prisma";
    const names = args.filter(arg => !arg.startsWith("-"));
    const flags = args.filter(arg => arg.startsWith("-"));

    for (const name of names.length ? names : ["app"]) {
      const source = name === "app" ? appSchema : getDir("plugins", name, "schema.prisma");
      if (!existsSync(source)) {
        console.error(`[nano-app] [ERROR] "${name}" has no schema: ${source}`);
        process.exit(1);
      }

      // A copy whose client lands next to it
      const dir = `${process.cwd()}/.nano-app/prisma-clients/${name}`;
      mkdirSync(dir, { recursive: true });
      writeFileSync(`${dir}/schema.prisma`, readFileSync(source, "utf-8").replace(/output\s*=\s*"[^"]*"/, 'output = "./generated"'));

      prisma("generate", "--schema", `${dir}/schema.prisma`);
      if (command === "push") prisma("db", "push", "--schema", `${dir}/schema.prisma`, "--url", process.env.DATABASE_URL ?? "", ...flags);
    }
  }
} catch (error: any) {
  process.exit(error?.status ?? 1);
}
