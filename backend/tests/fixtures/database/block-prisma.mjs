// Module hook that makes the Prisma stack impossible to resolve, as in an app that never installed it
import { register } from 'node:module';

register(
  `data:text/javascript,${encodeURIComponent(`
  export async function resolve(sSpecifier, oContext, fnNext) {
    if (/^(@prisma\\/|pg$|prisma$)/.test(sSpecifier)) throw new Error("BLOCKED " + sSpecifier);
    return fnNext(sSpecifier, oContext);
  }
`)}`,
);
