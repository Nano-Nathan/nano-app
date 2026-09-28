import { createRoute } from "../../../../../src/app/creators";

/** Fixture: nested route with an expression */
export default createRoute({ expression: ":id", GET: async () => ({ success: true }) });
