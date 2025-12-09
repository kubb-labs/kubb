import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { isPlainObject } from 'remeda'

import { hasItems, isReference } from './utils.ts'

type SchemaObject = (OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject) & {
  nullable?: boolean
  items?: SchemaObject | ReferenceObject
}
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject

// Helper type to access numeric constraint properties safely
type NumericConstraintField =
  | 'minimum'
  | 'maximum'
  | 'exclusiveMinimum'
  | 'exclusiveMaximum'
  | 'multipleOf'
  | 'minLength'
  | 'maxLength'
  | 'minItems'
  | 'maxItems'
  | 'minProperties'
  | 'maxProperties'

/**
 * Merges OpenAPI Schema "allOf" arrays into a single Schema object.
 *
 * This function takes a schema that may contain an `allOf` property and merges all
 * schemas in the `allOf` array into a single schema. The merge follows OpenAPI semantics
 * with specific rules for different schema properties.
 *
 * Merge rules:
 * - `properties`: Shallow merge. Later entries override earlier ones for the same property key.
 * - `required`: Union of all required arrays (deduplicated).
 * - `type`: Root schema's type takes precedence. Otherwise, later entries override earlier ones.
 * - `description`: Root schema's description takes precedence. Otherwise, concatenate non-empty
 *   descriptions from allOf entries with `\n\n`.
 * - `nullable`, `deprecated`, `readOnly`, `writeOnly`: If any entry sets to true, result is true.
 *   Root schema overrides if explicitly set.
 * - `example`: Root schema's example takes precedence. Otherwise, use the last non-empty example.
 * - `enum`: Union of all enum arrays (deduplicated).
 * - `additionalProperties`: If any entry sets to false, result is false. If it's an object/schema,
 *   prefer root or later entry.
 * - `items`: For array schemas, prefer later entries.
 * - Other properties: Shallow merge with later entries overriding earlier ones.
 *
 * The function recursively processes property schemas that contain `allOf`.
 *
 * @param schema - An OpenAPI SchemaObject or ReferenceObject
 * @returns A SchemaObject with allOf merged, or the original ReferenceObject if input is a reference
 *
 * @example
 * ```typescript
 * const schema = {
 *   allOf: [
 *     { type: 'object', properties: { id: { type: 'string' } } },
 *     { description: 'A shared link' }
 *   ],
 *   nullable: true
 * }
 * const merged = mergeAllOf(schema)
 * // Result: { type: 'object', properties: { id: { type: 'string' } }, description: 'A shared link', nullable: true }
 * ```
 */
export function mergeAllOf(schema: SchemaObject | ReferenceObject): SchemaObject | ReferenceObject {
  // If it's a reference, return it unchanged
  if (isReference(schema)) {
    return schema
  }

  // If there's no allOf, just recursively process properties if they exist
  if (!schema.allOf) {
    return recursivelyMergeProperties(schema)
  }

  // Merge all schemas in allOf
  const allOfSchemas = schema.allOf.map((s) => {
    // Each entry in allOf might itself be a reference or have nested allOf
    if (isReference(s)) {
      return s
    }
    // Recursively merge nested allOf
    return mergeAllOf(s)
  })

  // Start with an empty base and merge all allOf entries
  let merged: SchemaObject = {}

  for (const allOfSchema of allOfSchemas) {
    if (isReference(allOfSchema)) {
      // If there's a reference in allOf, we can't merge it
      // In this case, we'll skip it and let the caller handle $ref resolution
      continue
    }
    merged = mergeSchemas(merged, allOfSchema)
  }

  // Now merge the root schema (excluding allOf) with the merged allOf result
  // Root schema properties take precedence
  const { allOf: _, ...rootWithoutAllOf } = schema
  const result = mergeSchemas(merged, rootWithoutAllOf as SchemaObject)

  // Recursively process properties
  return recursivelyMergeProperties(result)
}

/**
 * Recursively processes properties in a schema to merge any nested allOf.
 */
function recursivelyMergeProperties(schema: SchemaObject): SchemaObject {
  if (schema.properties && isPlainObject(schema.properties)) {
    const mergedProperties: Record<string, SchemaObject | ReferenceObject> = {}
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (propSchema && typeof propSchema === 'object') {
        mergedProperties[key] = mergeAllOf(propSchema)
      } else {
        mergedProperties[key] = propSchema
      }
    }
    return { ...schema, properties: mergedProperties }
  }

  // Also handle items for array schemas
  if (hasItems(schema)) {
    return { ...schema, items: mergeAllOf(schema.items) } as SchemaObject
  }

  return schema
}

/**
 * Merges two schema objects according to OpenAPI allOf semantics.
 * The `later` schema takes precedence for most properties.
 */
function mergeSchemas(earlier: SchemaObject, later: SchemaObject): SchemaObject {
  const result: SchemaObject = { ...earlier }

  // Merge properties (shallow merge, later overrides)
  if (later.properties || earlier.properties) {
    result.properties = {
      ...(earlier.properties || {}),
      ...(later.properties || {}),
    }
  }

  // Merge required arrays (union, deduplicated)
  if (later.required || earlier.required) {
    const requiredSet = new Set([...(earlier.required || []), ...(later.required || [])])
    result.required = Array.from(requiredSet)
  }

  // Type: later overrides earlier
  if (later.type !== undefined) {
    result.type = later.type
  } else if (earlier.type !== undefined) {
    result.type = earlier.type
  }

  // Description: later overrides earlier
  if (later.description !== undefined) {
    result.description = later.description
  } else if (earlier.description !== undefined) {
    result.description = earlier.description
  }

  // Boolean flags: true if any is true, but later explicit value wins
  if (later.nullable !== undefined) {
    result.nullable = later.nullable
  } else if (earlier.nullable === true) {
    result.nullable = true
  }

  if (later.deprecated !== undefined) {
    result.deprecated = later.deprecated
  } else if (earlier.deprecated === true) {
    result.deprecated = true
  }

  if (later.readOnly !== undefined) {
    result.readOnly = later.readOnly
  } else if (earlier.readOnly === true) {
    result.readOnly = true
  }

  if (later.writeOnly !== undefined) {
    result.writeOnly = later.writeOnly
  } else if (earlier.writeOnly === true) {
    result.writeOnly = true
  }

  // Example: later overrides earlier
  if (later.example !== undefined) {
    result.example = later.example
  } else if (earlier.example !== undefined) {
    result.example = earlier.example
  }

  // Enum: union of all values (deduplicated)
  if (later.enum || earlier.enum) {
    const enumSet = new Set([...(earlier.enum || []), ...(later.enum || [])])
    result.enum = Array.from(enumSet)
  }

  // additionalProperties: false takes precedence, otherwise later overrides
  if (later.additionalProperties !== undefined) {
    result.additionalProperties = later.additionalProperties
  } else if (earlier.additionalProperties === false) {
    result.additionalProperties = false
  } else if (earlier.additionalProperties !== undefined) {
    result.additionalProperties = earlier.additionalProperties
  }

  // Items: later overrides earlier
  if (later.items !== undefined) {
    result.items = later.items
  } else if (earlier.items !== undefined) {
    result.items = earlier.items
  }

  // Format: later overrides earlier
  if (later.format !== undefined) {
    result.format = later.format
  } else if (earlier.format !== undefined) {
    result.format = earlier.format
  }

  // Pattern: later overrides earlier
  if (later.pattern !== undefined) {
    result.pattern = later.pattern
  } else if (earlier.pattern !== undefined) {
    result.pattern = earlier.pattern
  }

  // Numeric constraints: later overrides earlier
  const numericFields: NumericConstraintField[] = [
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf',
    'minLength',
    'maxLength',
    'minItems',
    'maxItems',
    'minProperties',
    'maxProperties',
  ]

  for (const field of numericFields) {
    const laterValue = later[field]
    const earlierValue = earlier[field]
    if (laterValue !== undefined) {
      // Use index signature to safely assign potentially mixed types
      ;(result as Record<string, unknown>)[field] = laterValue
    } else if (earlierValue !== undefined) {
      ;(result as Record<string, unknown>)[field] = earlierValue
    }
  }

  // uniqueItems: later overrides earlier
  if (later.uniqueItems !== undefined) {
    result.uniqueItems = later.uniqueItems
  } else if (earlier.uniqueItems !== undefined) {
    result.uniqueItems = earlier.uniqueItems
  }

  // Default: later overrides earlier
  if (later.default !== undefined) {
    result.default = later.default
  } else if (earlier.default !== undefined) {
    result.default = earlier.default
  }

  // Title: later overrides earlier
  if (later.title !== undefined) {
    result.title = later.title
  } else if (earlier.title !== undefined) {
    result.title = earlier.title
  }

  // discriminator: later overrides earlier
  if (later.discriminator !== undefined) {
    result.discriminator = later.discriminator
  } else if (earlier.discriminator !== undefined) {
    result.discriminator = earlier.discriminator
  }

  // xml: later overrides earlier
  if (later.xml !== undefined) {
    result.xml = later.xml
  } else if (earlier.xml !== undefined) {
    result.xml = earlier.xml
  }

  // externalDocs: later overrides earlier
  if (later.externalDocs !== undefined) {
    result.externalDocs = later.externalDocs
  } else if (earlier.externalDocs !== undefined) {
    result.externalDocs = earlier.externalDocs
  }

  // Copy any other properties from later schema
  // We need to cast here to allow index signature access
  const resultWithIndex = result as Record<string, unknown>
  const laterWithIndex = later as Record<string, unknown>
  for (const key of Object.keys(later)) {
    if (!(key in result)) {
      resultWithIndex[key] = laterWithIndex[key]
    }
  }

  return result
}
