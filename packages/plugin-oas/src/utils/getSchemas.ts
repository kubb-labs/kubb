import type { contentType, Oas, OasTypes } from '@kubb/oas'

export type GetSchemasResult = {
  schemas: Record<string, OasTypes.SchemaObject>
  /**
   * Mapping from original component name to resolved name after collision handling
   * e.g., { 'Order': 'OrderSchema', 'variant': 'variant2' }
   */
  nameMapping: Map<string, string>
}

type Mode = 'schemas' | 'responses' | 'requestBodies'

type GetSchemasProps = {
  oas: Oas
  contentType?: contentType
  includes?: Mode[]
  /**
   * Whether to resolve name collisions with suffixes.
   * If not provided, uses oas.options.collisionDetection
   * @default false (from oas.options or fallback)
   */
  collisionDetection?: boolean
}

/**
 * Collect schemas from OpenAPI components (schemas, responses, requestBodies)
 * and return them in dependency order along with name mapping for collision resolution.
 *
 * This function is a wrapper around the oas.getSchemas() method for backward compatibility.
 * New code should use oas.getSchemas() directly.
 *
 * @deprecated Use oas.getSchemas() instead
 */
export function getSchemas({ oas, contentType, includes = ['schemas', 'requestBodies', 'responses'], collisionDetection }: GetSchemasProps): GetSchemasResult {
  return oas.getSchemas({
    contentType,
    includes,
    collisionDetection,
  })
}
