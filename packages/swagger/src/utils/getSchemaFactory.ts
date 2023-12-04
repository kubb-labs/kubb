import { isOpenApiV3_1Document } from './isOpenApiV3_1Document.ts'

import type { Oas, OasTypes, OpenAPIV3, OpenAPIV3_1 } from '../oas/index.ts'

/**
 * Make it possible to narrow down the schema based on a specific version(3 or 3.1)
 */
type SchemaResult<TWithRef extends boolean = false> = {
  schema?: TWithRef extends true ? OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject : OpenAPIV3.SchemaObject
  version: '3.0'
} | {
  schema?: TWithRef extends true ? OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject : OpenAPIV3_1.SchemaObject
  version: '3.1'
}

export function getSchemaFactory<TWithRef extends boolean = false>(
  oas: Oas,
): (schema?: OasTypes.SchemaObject) => SchemaResult<TWithRef> {
  return (schema?: OasTypes.SchemaObject) => {
    const version = isOpenApiV3_1Document(oas.api) ? '3.1' : '3.0'

    return {
      schema,
      version,
    } as SchemaResult<TWithRef>
  }
}
