import { isDiscriminator, isReference } from './guards.ts'
import { extractRefKey, resolveRef, setRef } from './refs.ts'
import type { DiscriminatorObject, Document, ReferenceObject, SchemaObject } from './types.ts'

/**
 * Prefix used to create synthetic `$ref` values for anonymous (inline) discriminator schemas.
 * The suffix is the schema index within the discriminator's `oneOf`/`anyOf` array.
 * @example `#kubb-inline-0`
 */
export const KUBB_INLINE_REF_PREFIX = '#kubb-inline-'

/**
 * Returns a normalised discriminator object with a fully populated `mapping`.
 *
 * Missing mapping entries are inferred from union members using (in order):
 * a vendor extension property, a `const` value, a single-value `enum`, then `title`.
 *
 * @example
 * ```ts
 * getDiscriminator(document, schema)
 * // { propertyName: 'type', mapping: { dog: '#/components/schemas/Dog', cat: '#/components/schemas/Cat' } }
 * ```
 */
export function getDiscriminator(document: Document, schema: SchemaObject | null): DiscriminatorObject | null {
  if (!isDiscriminator(schema) || !schema) {
    return null
  }

  const { mapping = {}, propertyName } = schema.discriminator

  const getDiscriminatorValue = (schema: SchemaObject | null): string | null => {
    if (!schema) {
      return null
    }

    if (propertyName.startsWith('x-')) {
      const extensionValue = (schema as Record<string, unknown>)[propertyName]
      if (extensionValue && typeof extensionValue === 'string') {
        return extensionValue
      }
    }

    const propertySchema = schema.properties?.[propertyName] as SchemaObject
    if (propertySchema && 'const' in propertySchema && propertySchema.const !== undefined) {
      return String(propertySchema.const)
    }

    if (propertySchema && propertySchema.enum?.length === 1) {
      return String(propertySchema.enum[0])
    }

    return schema.title || null
  }

  const processSchemas = (schemas: Array<SchemaObject>, existingMapping: Record<string, string>) => {
    schemas.forEach((schemaItem, index) => {
      if (isReference(schemaItem)) {
        const key = extractRefKey(schemaItem.$ref)

        try {
          const refSchema = resolveRef<SchemaObject>(document, schemaItem.$ref)
          const discriminatorValue = getDiscriminatorValue(refSchema)
          const canAdd = key && !Object.values(existingMapping).includes(schemaItem.$ref)

          if (canAdd && discriminatorValue) {
            existingMapping[discriminatorValue] = schemaItem.$ref
          } else if (canAdd) {
            existingMapping[key] = schemaItem.$ref
          }
        } catch (_error) {
          if (key && !Object.values(existingMapping).includes(schemaItem.$ref)) {
            existingMapping[key] = schemaItem.$ref
          }
        }
      } else {
        const inlineSchema = schemaItem as SchemaObject
        const discriminatorValue = getDiscriminatorValue(inlineSchema)

        if (discriminatorValue) {
          existingMapping[discriminatorValue] = `${KUBB_INLINE_REF_PREFIX}${index}`
        }
      }
    })
  }

  if (schema.oneOf) {
    processSchemas(schema.oneOf as Array<SchemaObject>, mapping)
  }

  if (schema.anyOf) {
    processSchemas(schema.anyOf as Array<SchemaObject>, mapping)
  }

  return {
    ...schema.discriminator,
    mapping,
  }
}

function setDiscriminatorOnChild(document: Document, schema: SchemaObject & { discriminator: DiscriminatorObject }): void {
  const { mapping = {}, propertyName } = schema.discriminator

  Object.entries(mapping).forEach(([mappingKey, mappingValue]) => {
    if (mappingValue) {
      const childSchema = resolveRef<any>(document, mappingValue)
      if (!childSchema) {
        return
      }

      if (!childSchema.properties) {
        childSchema.properties = {}
      }

      const property = childSchema.properties[propertyName] as SchemaObject

      if (childSchema.properties) {
        childSchema.properties[propertyName] = {
          ...((childSchema.properties ? childSchema.properties[propertyName] : {}) as SchemaObject),
          enum: [...(property?.enum?.filter((value) => value !== mappingKey) ?? []), mappingKey],
        }

        childSchema.required = typeof childSchema.required === 'boolean' ? childSchema.required : [...new Set([...(childSchema.required ?? []), propertyName])]

        setRef(document, mappingValue, childSchema)
      }
    }
  })
}

/**
 * Mutates `document` in-place so discriminator values are propagated into mapped child schemas.
 *
 * Performs a DFS over `components.schemas`, visiting every schema that carries a structured
 * `discriminator` object and applying the mapping values to each child schema.
 * Cycles are handled with a `WeakSet` guard.
 *
 * @example
 * ```ts
 * applyDiscriminatorInheritance(document)
 * // document.components.schemas children now carry their discriminator enum values
 * ```
 */
export function applyDiscriminatorInheritance(document: Document): void {
  const components = document.components
  if (!components?.schemas) {
    return
  }

  const visited = new WeakSet<object>()

  const enqueue = (value: unknown) => {
    if (!value) return
    if (Array.isArray(value)) {
      for (const item of value) enqueue(item)
      return
    }
    if (typeof value === 'object') {
      visit(value as SchemaObject)
    }
  }

  const visit = (schema?: SchemaObject | ReferenceObject | null) => {
    if (!schema || typeof schema !== 'object') return

    if (isReference(schema)) {
      visit(resolveRef<SchemaObject>(document, schema.$ref))
      return
    }

    const schemaObject = schema as SchemaObject

    if (visited.has(schemaObject as object)) return
    visited.add(schemaObject as object)

    if (isDiscriminator(schemaObject)) {
      setDiscriminatorOnChild(document, schemaObject)
    }

    if ('allOf' in schemaObject) enqueue(schemaObject.allOf)
    if ('oneOf' in schemaObject) enqueue(schemaObject.oneOf)
    if ('anyOf' in schemaObject) enqueue(schemaObject.anyOf)
    if ('not' in schemaObject) enqueue(schemaObject.not)
    if ('items' in schemaObject) enqueue(schemaObject.items)
    if ('prefixItems' in schemaObject) enqueue(schemaObject.prefixItems)

    if (schemaObject.properties) {
      enqueue(Object.values(schemaObject.properties))
    }

    if (schemaObject.additionalProperties && typeof schemaObject.additionalProperties === 'object') {
      enqueue(schemaObject.additionalProperties)
    }
  }

  for (const schema of Object.values(components.schemas)) {
    visit(schema as SchemaObject)
  }
}
