// Module hook that makes the Prisma stack impossible to resolve, as in an app that never installed it
import { register } from "node:module";

register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (/^(@prisma\\/|pg$|prisma$)/.test(specifier)) throw new Error("BLOCKED " + specifier);
    return next(specifier, context);
  }
`)}`);
