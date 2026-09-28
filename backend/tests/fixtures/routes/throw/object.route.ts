import { createRoute } from "../../../../src/app/creators";

/** Throws the shape the framework expects: { status, message } */
export default createRoute({
  GET: async () => { throw { status: 409, message: "ya existe" }; },
});
