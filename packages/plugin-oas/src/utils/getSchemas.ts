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
 * For schemas with circular dependencies, ensure that schemas referenced
 * in oneOf/anyOf are defined before the schema that references them.
 */
function sortSchemas(schemas: Record<string, OasTypes.SchemaObject>): Record<string, OasTypes.SchemaObject> {
  const deps = new Map<string, string[]>()
  const oneOfDeps = new Map<string, string[]>()

  // Collect all dependencies and specifically track oneOf/anyOf dependencies
  for (const [name, schema] of Object.entries(schemas)) {
    const allRefs = Array.from(collectRefs(schema))
    deps.set(name, allRefs)

    // Track oneOf/anyOf refs separately
    const oneOfRefs: string[] = []
    if (schema.oneOf) {
      for (const item of schema.oneOf) {
        const refs = collectRefs(item)
        oneOfRefs.push(...Array.from(refs))
      }
    }
    if (schema.anyOf) {
      for (const item of schema.anyOf) {
        const refs = collectRefs(item)
        oneOfRefs.push(...Array.from(refs))
      }
    }
    if (oneOfRefs.length > 0) {
      oneOfDeps.set(name, oneOfRefs)
    }
  }

  const sorted: string[] = []
  const visited = new Set<string>()
  const inProgress = new Set<string>()

  function visit(name: string, stack = new Set<string>()) {
    if (visited.has(name)) {
      return
    }
    if (stack.has(name)) {
      // Circular dependency detected
      return
    }
    
    stack.add(name)
    inProgress.add(name)
    
    const children = deps.get(name) || []
    const oneOfChildren = oneOfDeps.get(name) || []
    
    // For schemas with oneOf/anyOf, prioritize visiting those dependencies first
    // to ensure they are defined before the union
    for (const child of oneOfChildren) {
      if (deps.has(child) && !inProgress.has(child)) {
        visit(child, stack)
      }
    }
    
    // Then visit other dependencies
    for (const child of children) {
      if (deps.has(child) && !oneOfChildren.includes(child) && !inProgress.has(child)) {
        visit(child, stack)
      }
    }
    
    stack.delete(name)
    inProgress.delete(name)
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
 * Collect schemas from OpenAPI components (schemas, responses, requestBodies)
 * and return them in dependency order.
 */
export function getSchemas({ oas, contentType, includes = ['schemas', 'requestBodies', 'responses'] }: GetSchemasProps): Record<string, OasTypes.SchemaObject> {
  const components = oas.getDefinition().components
  let schemas: Record<string, OasTypes.SchemaObject> = {}

  if (includes.includes('schemas')) {
    schemas = {
      ...schemas,
      ...((components?.schemas as Record<string, OasTypes.SchemaObject>) || {}),
    }
  }

  if (includes.includes('responses')) {
    const responses = components?.responses || {}
    for (const [name, response] of Object.entries(responses)) {
      const r = response as OasTypes.ResponseObject
      if (r.content && !schemas[name]) {
        const firstContentType = Object.keys(r.content)[0] || 'application/json'
        schemas[name] = r.content?.[contentType || firstContentType]?.schema as OasTypes.SchemaObject
      }
    }
  }

  if (includes.includes('requestBodies')) {
    const requestBodies = components?.requestBodies || {}
    for (const [name, request] of Object.entries(requestBodies)) {
      const r = request as OasTypes.RequestBodyObject
      if (r.content && !schemas[name]) {
        const firstContentType = Object.keys(r.content)[0] || 'application/json'
        schemas[name] = r.content?.[contentType || firstContentType]?.schema as OasTypes.SchemaObject
      }
    }
  }

  return sortSchemas(schemas)
}
