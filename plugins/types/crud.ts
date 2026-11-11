import type { ZodType } from 'zod';

/** Validations of a model, zod schemas, each one optional: without it the body goes to Drizzle as it came */
export type CrudValidations = {
  /** Body of a `POST` */
  insert?: ZodType;
  /** Body of a `PUT` */
  update?: ZodType;
  /** Body of a `QUERY`, and `{}` for a `GET`: the place for a default or a top `limit` */
  query?: ZodType;
};
