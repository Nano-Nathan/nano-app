import { createRoute } from "../../../../src/app/creators";

/** Fixture: index route with no expression */
export default createRoute({ GET: async () => ({ success: true }) });
