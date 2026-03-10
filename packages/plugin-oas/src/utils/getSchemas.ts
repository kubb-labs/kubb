import type { contentType, Oas, OasTypes } from '@kubb/oas'

/**
 * A schema object with `minimum`/`maximum` normalized to Kubb's `min`/`max` convention.
 * This type is local to `plugin-oas` — the `min`/`max` fields belong to Kubb's AST layer,
 * not to the raw `@kubb/oas` schema types.
 */
export type NormalizedSchemaObject = Omit<OasTypes.SchemaObject, 'minimum' | 'maximum'> & {
  min?: number
  max?: number
}

export type GetSchemasResult = {
  schemas: Record<string, NormalizedSchemaObject>
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
 * Normalize a raw OAS SchemaObject so that `minimum`/`maximum` are
 * surfaced as `min`/`max` (consistent with Kubb's AST naming convention).
 * The original `minimum`/`maximum` keys are removed to avoid ambiguity.
 */
function normalizeSchema({ minimum, maximum, ...rest }: OasTypes.SchemaObject): NormalizedSchemaObject {
  return {
    ...rest,
    ...(minimum !== undefined && { min: minimum }),
    ...(maximum !== undefined && { max: maximum }),
  }
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
  const { schemas, nameMapping } = oas.getSchemas({
    contentType,
    includes,
    collisionDetection,
  })

  const normalizedSchemas: Record<string, NormalizedSchemaObject> = {}
  for (const [name, schema] of Object.entries(schemas)) {
    normalizedSchemas[name] = normalizeSchema(schema)
  }

  return { schemas: normalizedSchemas, nameMapping }
}
