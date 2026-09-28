import { createRoute } from "../../../../src/app/creators";

/** Fixture: index route with an expression */
export default createRoute({ expression: ":entity", GET: async () => ({ success: true }) });
