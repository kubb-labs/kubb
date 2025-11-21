import type { contentType, Oas, OasTypes } from '@kubb/oas'

type Mode = 'schemas' | 'responses' | 'requestBodies'

type GetSchemasProps = {
  oas: Oas
  contentType?: contentType
  includes?: Mode[]
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
 * Check if a name conflicts with existing names (case-insensitive)
 */
function hasNameConflict(name: string, existingNames: Set<string>): boolean {
  const lowerName = name.toLowerCase()
  for (const existing of existingNames) {
    if (existing.toLowerCase() === lowerName && existing !== name) {
      return true
    }
  }
  return false
}

/**
 * Get a unique name by adding a suffix if there's a case-insensitive conflict
 */
function getUniqueSchemaName(name: string, existingNames: Set<string>, suffix: string): string {
  if (!hasNameConflict(name, existingNames)) {
    return name
  }
  
  // If there's a conflict, add the suffix
  let uniqueName = `${name}${suffix}`
  let counter = 2
  
  // If the name with suffix still conflicts, add a number
  while (hasNameConflict(uniqueName, existingNames) || existingNames.has(uniqueName)) {
    uniqueName = `${name}${suffix}${counter}`
    counter++
  }
  
  return uniqueName
}

/**
 * Collect schemas from OpenAPI components (schemas, responses, requestBodies)
 * and return them in dependency order.
 */
export function getSchemas({ oas, contentType, includes = ['schemas', 'requestBodies', 'responses'] }: GetSchemasProps): Record<string, OasTypes.SchemaObject> {
  const components = oas.getDefinition().components
  const schemas: Record<string, OasTypes.SchemaObject> = {}
  const existingNames = new Set<string>()

  if (includes.includes('schemas')) {
    const componentSchemas = (components?.schemas as Record<string, OasTypes.SchemaObject>) || {}
    for (const [name, schema] of Object.entries(componentSchemas)) {
      const uniqueName = getUniqueSchemaName(name, existingNames, 'Schema')
      schemas[uniqueName] = schema
      existingNames.add(uniqueName)
    }
  }

  if (includes.includes('responses')) {
    const responses = components?.responses || {}
    for (const [name, response] of Object.entries(responses)) {
      const r = response as OasTypes.ResponseObject
      if (r.content) {
        const firstContentType = Object.keys(r.content)[0] || 'application/json'
        const schema = r.content?.[contentType || firstContentType]?.schema as OasTypes.SchemaObject
        if (schema) {
          const uniqueName = getUniqueSchemaName(name, existingNames, 'Response')
          schemas[uniqueName] = schema
          existingNames.add(uniqueName)
        }
      }
    }
  }

  if (includes.includes('requestBodies')) {
    const requestBodies = components?.requestBodies || {}
    for (const [name, request] of Object.entries(requestBodies)) {
      const r = request as OasTypes.RequestBodyObject
      if (r.content) {
        const firstContentType = Object.keys(r.content)[0] || 'application/json'
        const schema = r.content?.[contentType || firstContentType]?.schema as OasTypes.SchemaObject
        if (schema) {
          const uniqueName = getUniqueSchemaName(name, existingNames, 'RequestBody')
          schemas[uniqueName] = schema
          existingNames.add(uniqueName)
        }
      }
    }
  }

  return sortSchemas(schemas)
}
