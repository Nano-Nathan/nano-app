import type { ZodType } from 'zod';

/** Validations of a model, zod schemas by action, each one optional: without it the body goes to Drizzle as it came */
export type CrudValidations = {
  /** Body of a `QUERY`, and `{}` for a `GET`: the place for a default or a top `limit`, and for what a query may load */
  read?: ZodType;
  /** Body of a `POST` */
  create?: ZodType;
  /** Body of a `PUT` */
  update?: ZodType;
};
