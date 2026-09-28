import { createRoute } from "../../../src/app/creators";

/** Route to /health */
export default createRoute({
  GET: async () => ({ success: true, result: { status: "ok" } }),
  POST: async (req) => ({ success: true, result: req.body }),
});
