import type { Oas, OpenAPIV3, OpenAPIV3_1, SchemaObject } from '@kubb/oas'
import { isOpenApiV3_1Document } from '@kubb/oas'

/**
 * Make it possible to narrow down the schema based on a specific version(3 or 3.1)
 */
type SchemaResult<TWithRef extends boolean = false> =
  | {
      schemaObject:
        | ((TWithRef extends true ? OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject : OpenAPIV3.SchemaObject) & {
            nullable?: boolean
            'x-nullable'?: boolean
          })
        | null
      version: '3.0'
    }
  | {
      schemaObject:
        | ((TWithRef extends true ? OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject : OpenAPIV3_1.SchemaObject) & {
            nullable?: boolean
            'x-nullable'?: boolean
          })
        | null
      version: '3.1'
    }

/**
 * Creates a factory function that generates a versioned OpenAPI schema result.
 *
 * The returned function accepts an optional schema object and produces a {@link SchemaResult} containing the dereferenced schema and the OpenAPI version ('3.0' or '3.1').
 *
 * @returns A function that takes an optional schema and returns a versioned schema result.
 */
export function getSchemaFactory<TWithRef extends boolean = false>(oas: Oas): (schema: SchemaObject | null) => SchemaResult<TWithRef> {
  return (schema: SchemaObject | null) => {
    const version = isOpenApiV3_1Document(oas.api) ? '3.1' : '3.0'

    return {
      schemaObject: oas.dereferenceWithRef(schema),
      version,
    } as SchemaResult<TWithRef>
  }
}
