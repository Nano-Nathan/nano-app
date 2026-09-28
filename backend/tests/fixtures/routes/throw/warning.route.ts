import { createRoute } from "../../../../src/app/creators";

/** Throws a warning */
export default createRoute({
  GET: async () => { throw { status: 422, message: "revisá los datos", warning: true }; },
});
