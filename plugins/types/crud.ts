import type { ZodType } from 'zod';

/** Validations of a model: a zod schema by action, each one optional */
export type CrudValidations = {
  /** Body of a `QUERY`, and `{}` for a `GET` */
  read?: ZodType;
  /** Body of a `POST` */
  create?: ZodType;
  /** Body of a `PUT` */
  update?: ZodType;
};
