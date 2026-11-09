/** A field of a Prisma model, as the client's runtime data model describes it */
export type ModelField = { name: string; kind: string; type: string };

/** Models of the app's Prisma client by name (`Note`), from its `_runtimeDataModel` */
export type DataModels = { [name: string]: { fields: ModelField[] } };
