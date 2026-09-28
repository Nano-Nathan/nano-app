import { createRoute } from "../../../../src/app/creators";

/** Throws a plain string */
export default createRoute({
  GET: async () => { throw "falta el campo name"; },
});
