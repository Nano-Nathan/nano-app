import { createRoute } from "../../../../src/app/creators";

/** Throws an Error, with no status */
export default createRoute({
  GET: async () => { throw new Error("explotó"); },
});
