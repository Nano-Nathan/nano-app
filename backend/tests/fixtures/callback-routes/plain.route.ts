import { createRoute } from "../../../src/app/creators";

/** Route without callbacks, next to hook.route.ts */
export default createRoute({
  GET: async () => ({ success: true }),
});
