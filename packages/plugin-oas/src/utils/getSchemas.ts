import { pascalCase } from '@kubb/core/transformers'
import type { contentType, Oas, OasTypes } from '@kubb/oas'

type Mode = 'schemas' | 'responses' | 'requestBodies'

type GetSchemasProps = {
  oas: Oas
  contentType?: contentType
  includes?: Mode[]
}

type SchemaWithMetadata = {
  schema: OasTypes.SchemaObject
  source: Mode
  originalName: string
}

export type GetSchemasResult = {
  schemas: Record<string, OasTypes.SchemaObject>
  /**
   * Mapping from original component name to resolved name after collision handling
   * e.g., { 'Order': 'OrderSchema', 'variant': 'variant2' }
   */
  nameMapping: Map<string, string>
}

/**
 * Collect all schema $ref dependencies recursively.
 */
function collectRefs(schema: unknown, refs = new Set<string>()): Set<string> {
  if (Array.isArray(schema)) {
    for (const item of schema) {
      collectRefs(item, refs)
    }
    return refs
  }

  if (schema && typeof schema === 'object') {
    for (const [key, value] of Object.entries(schema)) {
      if (key === '$ref' && typeof value === 'string') {
        const match = value.match(/^#\/components\/schemas\/(.+)$/)
        if (match) {
          refs.add(match[1]!)
        }
      } else {
        collectRefs(value, refs)
      }
    }
  }

  return refs
}

/**
 * Sort schemas topologically so referenced schemas appear first.
 */
function sortSchemas(schemas: Record<string, OasTypes.SchemaObject>): Record<string, OasTypes.SchemaObject> {
  const deps = new Map<string, string[]>()

  for (const [name, schema] of Object.entries(schemas)) {
    deps.set(name, Array.from(collectRefs(schema)))
  }

  const sorted: string[] = []
  const visited = new Set<string>()

  function visit(name: string, stack = new Set<string>()) {
    if (visited.has(name)) {
      return
    }
    if (stack.has(name)) {
      return
    } // circular refs, ignore
    stack.add(name)
    const children = deps.get(name) || []
    for (const child of children) {
      if (deps.has(child)) {
        visit(child, stack)
      }
    }
    stack.delete(name)
    visited.add(name)
    sorted.push(name)
  }

  for (const name of Object.keys(schemas)) {
    visit(name)
  }

  const sortedSchemas: Record<string, OasTypes.SchemaObject> = {}
  for (const name of sorted) {
    sortedSchemas[name] = schemas[name]!
  }
  return sortedSchemas
}

/**
 * Extract schema from content object (used by responses and requestBodies).
 * Returns null if the schema is just a $ref (not a unique type definition).
 */
function extractSchemaFromContent(content: Record<string, unknown> | undefined, preferredContentType?: contentType): OasTypes.SchemaObject | null {
  if (!content) {
    return null
  }
  const firstContentType = Object.keys(content)[0] || 'application/json'
  const targetContentType = preferredContentType || firstContentType
  const contentSchema = content[targetContentType] as { schema?: OasTypes.SchemaObject } | undefined
  const schema = contentSchema?.schema

  // Skip schemas that are just references - they don't define unique types
  if (schema && '$ref' in schema) {
    return null
  }

  return schema || null
}

/**
 * Get semantic suffix for a schema source.
 */
function getSemanticSuffix(source: Mode): string {
  switch (source) {
    case 'schemas':
      return 'Schema'
    case 'responses':
      return 'Response'
    case 'requestBodies':
      return 'Request'
  }
}

/**
 * Resolve name collisions by applying suffixes based on collision type.
 *
 * Strategy:
 * - Same-component collisions (e.g., "Variant" + "variant" both in schemas): numeric suffixes (Variant, Variant2)
 * - Cross-component collisions (e.g., "Pet" in schemas + "Pet" in requestBodies): semantic suffixes (PetSchema, PetRequest)
 *
 * @returns Object with resolved schemas and name mapping from original $ref paths to resolved names
 */
function resolveCollisions(schemasWithMeta: SchemaWithMetadata[]): { schemas: Record<string, OasTypes.SchemaObject>; nameMapping: Map<string, string> } {
  const schemas: Record<string, OasTypes.SchemaObject> = {}
  const nameMapping = new Map<string, string>()
  const normalizedNames = new Map<string, SchemaWithMetadata[]>()

  // Group schemas by normalized (PascalCase) name for collision detection
  for (const item of schemasWithMeta) {
    const normalized = pascalCase(item.originalName)
    if (!normalizedNames.has(normalized)) {
      normalizedNames.set(normalized, [])
    }
    normalizedNames.get(normalized)!.push(item)
  }

  // Process each collision group
  for (const [, items] of normalizedNames) {
    if (items.length === 1) {
      // No collision, use original name
      const item = items[0]!
      schemas[item.originalName] = item.schema
      // Map using full $ref path: #/components/{source}/{originalName}
      const refPath = `#/components/${item.source}/${item.originalName}`
      nameMapping.set(refPath, item.originalName)
      continue
    }

    // Multiple schemas normalize to same name - resolve collision
    const sources = new Set(items.map((item) => item.source))

    if (sources.size === 1) {
      // Same-component collision: add numeric suffixes
      // Preserve original order from OpenAPI spec for deterministic behavior
      items.forEach((item, index) => {
        const suffix = index === 0 ? '' : (index + 1).toString()
        const uniqueName = item.originalName + suffix
        schemas[uniqueName] = item.schema
        // Map using full $ref path: #/components/{source}/{originalName}
        const refPath = `#/components/${item.source}/${item.originalName}`
        nameMapping.set(refPath, uniqueName)
      })
    } else {
      // Cross-component collision: add semantic suffixes
      // Preserve original order from OpenAPI spec for deterministic behavior
      items.forEach((item) => {
        const suffix = getSemanticSuffix(item.source)
        const uniqueName = item.originalName + suffix
        schemas[uniqueName] = item.schema
        // Map using full $ref path: #/components/{source}/{originalName}
        const refPath = `#/components/${item.source}/${item.originalName}`
        nameMapping.set(refPath, uniqueName)
      })
    }
  }

  return { schemas, nameMapping }
}

/**
 * Collect schemas from OpenAPI components (schemas, responses, requestBodies)
 * and return them in dependency order along with name mapping for collision resolution.
 */
export function getSchemas({ oas, contentType, includes = ['schemas', 'requestBodies', 'responses'] }: GetSchemasProps): GetSchemasResult {
  const components = oas.getDefinition().components
  const schemasWithMeta: SchemaWithMetadata[] = []

  if (includes.includes('schemas')) {
    const componentSchemas = (components?.schemas as Record<string, OasTypes.SchemaObject>) || {}
    for (const [name, schema] of Object.entries(componentSchemas)) {
      schemasWithMeta.push({ schema, source: 'schemas', originalName: name })
    }
  }

  if (includes.includes('responses')) {
    const responses = components?.responses || {}
    for (const [name, response] of Object.entries(responses)) {
      const responseObject = response as OasTypes.ResponseObject
      const schema = extractSchemaFromContent(responseObject.content, contentType)
      if (schema) {
        schemasWithMeta.push({ schema, source: 'responses', originalName: name })
      }
    }
  }

  if (includes.includes('requestBodies')) {
    const requestBodies = components?.requestBodies || {}
    for (const [name, request] of Object.entries(requestBodies)) {
      const requestObject = request as OasTypes.RequestBodyObject
      const schema = extractSchemaFromContent(requestObject.content, contentType)
      if (schema) {
        schemasWithMeta.push({ schema, source: 'requestBodies', originalName: name })
      }
    }
  }

  const { schemas, nameMapping } = resolveCollisions(schemasWithMeta)
  return {
    schemas: sortSchemas(schemas),
    nameMapping,
  }
}
