import { createRoute } from "../../../src/app/creators";

/** Route of a fixture plugin with every endpoint callback: records them in `options.calls` */
export default createRoute({
  callbacks: {
    onInit: async ({ calls }) => { calls.push("init"); },
    onBefore: async (req, method, { calls }) => {
      calls.push(`before ${method}`);
      if (req.query.deny) throw { status: 403, message: "denied" };
      return { greeting: "hello" };
    },
  },

  GET: async (_req, { greeting, onBeforeResult }) => ({ success: true, result: { greeting, before: onBeforeResult?.greeting } }),
});
