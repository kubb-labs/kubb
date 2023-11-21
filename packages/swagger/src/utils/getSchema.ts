import type { OasTypes, OpenAPIV3, OpenAPIV3_1 } from '../types.ts'

export function getSchema<TVersion extends '3' | '3.1'>(
  schema: OasTypes.SchemaObject,
  _version: TVersion,
): TVersion extends '3' ? OpenAPIV3.SchemaObject : OpenAPIV3_1.SchemaObject {
  return schema
}
