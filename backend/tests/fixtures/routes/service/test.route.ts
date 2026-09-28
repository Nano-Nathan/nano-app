import { createRoute } from "../../../../src/app/creators";

/** Route to /service/test/:id */
export default createRoute({
  expression: ":id",
  GET: async (req) => ({ success: true, result: { id: req.params.id } }),
  DELETE: async () => ({ success: false, message: "no se puede borrar" }),
});
