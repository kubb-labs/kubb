import { isOpenApiV3_1Document } from '@kubb/oas'

import type { Oas, OpenAPIV3, OpenAPIV3_1, SchemaObject } from '@kubb/oas'

/**
 * Make it possible to narrow down the schema based on a specific version(3 or 3.1)
 */
type SchemaResult<TWithRef extends boolean = false> =
  | {
      schemaObject?: (TWithRef extends true ? OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject : OpenAPIV3.SchemaObject) & {
        nullable?: boolean
        'x-nullable'?: boolean
      }
      version: '3.0'
    }
  | {
      schemaObject?: (TWithRef extends true ? OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject : OpenAPIV3_1.SchemaObject) & {
        nullable?: boolean
        'x-nullable'?: boolean
      }
      version: '3.1'
    }

/**
 * Creates a factory function that generates a version-aware OpenAPI schema result.
 *
 * The returned function takes an optional schema object, dereferences it using the provided OpenAPI specification, and returns a {@link SchemaResult} containing the dereferenced schema and the detected OpenAPI version ('3.0' or '3.1').
 *
 * @returns A function that produces a {@link SchemaResult} for a given schema object.
 */
export function getSchemaFactory<TWithRef extends boolean = false>(oas: Oas): (schema?: SchemaObject) => SchemaResult<TWithRef> {
  return (schema?: SchemaObject) => {
    const version = isOpenApiV3_1Document(oas.api) ? '3.1' : '3.0'

    return {
      schemaObject: oas.dereferenceWithRef(schema),
      version,
    } as SchemaResult<TWithRef>
  }
}
