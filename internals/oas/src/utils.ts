import { pascalCase } from '@internals/utils'
import type { ParameterObject as OASParameterObject, SchemaObject as OASSchemaObject } from 'oas/types'
import { isRef } from 'oas/types'
import type { OpenAPIV3 } from 'openapi-types'
import { isPlainObject } from 'remeda'

export type SchemaObject = OASSchemaObject & {
  'x-nullable'?: boolean
  $ref?: string
}
export type ParameterObject = OASParameterObject

export type contentType = 'application/json' | (string & {})

export function isReference(obj?: any): obj is OpenAPIV3.ReferenceObject {
  return !!obj && isRef(obj)
}

export function isDiscriminator(obj?: any): obj is SchemaObject & { discriminator: OpenAPIV3.DiscriminatorObject } {
  return !!obj && obj?.['discriminator'] && typeof obj.discriminator !== 'string'
}

export function isOpenApiV2Document(doc: any): boolean {
  return doc && isPlainObject(doc) && !('openapi' in doc)
}

type SchemaSourceMode = 'schemas' | 'responses' | 'requestBodies' | 'parameters' | 'x-ext'

export type SchemaWithMetadata = {
  schema: SchemaObject
  source: SchemaSourceMode
  originalName: string
  /**
   * Optional override for the `$ref` path used in `nameMapping`.
   * Required for `x-ext` entries where the ref is `#/x-ext/{hash}` rather than `#/components/{source}/{name}`.
   */
  refPath?: string
}

export type GetSchemasResult = {
  schemas: Record<string, SchemaObject>
  nameMapping: Map<string, string>
}

/**
 * Extract schema from content object (used by responses and requestBodies).
 * Returns null if the schema is just a $ref (not a unique type definition).
 */
export function extractSchemaFromContent(content: Record<string, unknown> | undefined, preferredContentType?: contentType): SchemaObject | null {
  if (!content) {
    return null
  }
  const firstContentType = Object.keys(content)[0] || 'application/json'
  const targetContentType = preferredContentType || firstContentType
  const contentSchema = content[targetContentType] as { schema?: SchemaObject } | undefined
  const schema = contentSchema?.schema

  if (schema && '$ref' in schema) {
    return null
  }

  return schema || null
}

/**
 * Collect all schema $ref dependencies recursively.
 */
export function collectRefs(schema: unknown, refs = new Set<string>()): Set<string> {
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
 * Sort schemas topologically so referenced schemas appear before the schemas that reference them.
 */
export function sortSchemas(schemas: Record<string, SchemaObject>): Record<string, SchemaObject> {
  const deps = new Map<string, string[]>()

  for (const [name, schema] of Object.entries(schemas)) {
    deps.set(name, Array.from(collectRefs(schema)))
  }

  const sorted: string[] = []
  const visited = new Set<string>()

  function visit(name: string, stack = new Set<string>()) {
    if (visited.has(name)) return
    if (stack.has(name)) return // circular ref, skip
    stack.add(name)
    for (const child of deps.get(name) ?? []) {
      if (deps.has(child)) visit(child, stack)
    }
    stack.delete(name)
    visited.add(name)
    sorted.push(name)
  }

  for (const name of Object.keys(schemas)) {
    visit(name)
  }

  const result: Record<string, SchemaObject> = {}
  for (const name of sorted) {
    result[name] = schemas[name]!
  }
  return result
}

/**
 * Get semantic suffix for a schema source.
 */
export function getSemanticSuffix(source: SchemaSourceMode): string {
  switch (source) {
    case 'schemas':
      return 'Schema'
    case 'responses':
      return 'Response'
    case 'requestBodies':
      return 'Request'
    case 'parameters':
      return 'Parameter'
    case 'x-ext':
      return 'Ext'
  }
}

/**
 * Derive a schema name from a URL or file path.
 * Extracts the file basename without its extension.
 * @example deriveNameFromUrl('https://example.com/schemas/users.yaml') // 'users'
 * @example deriveNameFromUrl('/local/path/to/pet.json') // 'pet'
 */
export function deriveNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const basename = urlObj.pathname.split('/').pop() || url
    return basename.replace(/\.[^.]+$/, '')
  } catch {
    const basename = url.split(/[\\/]/).pop() || url
    return basename.replace(/\.[^.]+$/, '')
  }
}

const PATH_ITEM_VERBS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'])

/**
 * Returns true if the given object looks like an OpenAPI path item (has HTTP verb keys)
 * rather than a schema object.
 */
export function isPathItem(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  return Object.keys(obj).some((key) => PATH_ITEM_VERBS.has(key))
}

/**
 * Collect all unique `#/x-ext/...` $ref paths from a document.
 */
export function collectExtRefs(node: unknown, refs = new Set<string>()): Set<string> {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectExtRefs(item, refs)
    }
    return refs
  }

  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === 'x-ext' || key === 'x-ext-urls') {
        continue
      }
      if (key === '$ref' && typeof value === 'string' && value.startsWith('#/x-ext/')) {
        refs.add(value)
      } else {
        collectExtRefs(value, refs)
      }
    }
  }

  return refs
}

/**
 * Derive the best name for an external schema from its `$ref` path and the URL of its source file.
 *
 * @example deriveNameFromExtRef('#/x-ext/abc123', 'users.yaml')            // 'users'
 * @example deriveNameFromExtRef('#/x-ext/abc123/components/schemas/User', 'external.yaml') // 'User'
 */
export function deriveNameFromExtRef(ref: string, url: string | undefined): string {
  const segments = ref
    .replace(/^#\/x-ext\/[^/]+/, '')
    .split('/')
    .filter(Boolean)

  if (segments.length === 0) {
    return url ? deriveNameFromUrl(url) : ref.split('/').pop() || ref
  }

  if (segments.length >= 3 && segments[0] === 'components') {
    return segments[segments.length - 1]!
  }

  return segments[segments.length - 1]!
}

/**
 * Legacy resolution strategy — no collision detection, preserves backward compatibility.
 * @deprecated
 */
export function legacyResolve(schemasWithMeta: SchemaWithMetadata[]): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()

  for (const item of schemasWithMeta) {
    schemas[item.originalName] = item.schema
    const refPath = item.refPath ?? `#/components/${item.source}/${item.originalName}`
    nameMapping.set(refPath, item.originalName)
  }

  return { schemas, nameMapping }
}

/**
 * Resolve name collisions by applying suffixes based on collision type.
 */
export function resolveCollisions(schemasWithMeta: SchemaWithMetadata[]): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()
  const normalizedNames = new Map<string, SchemaWithMetadata[]>()

  for (const item of schemasWithMeta) {
    const normalized = pascalCase(item.originalName)
    if (!normalizedNames.has(normalized)) {
      normalizedNames.set(normalized, [])
    }
    normalizedNames.get(normalized)!.push(item)
  }

  for (const [, items] of normalizedNames) {
    if (items.length === 1) {
      const item = items[0]!
      schemas[item.originalName] = item.schema
      const refPath = item.refPath ?? `#/components/${item.source}/${item.originalName}`
      nameMapping.set(refPath, item.originalName)
      continue
    }

    const sources = new Set(items.map((item) => item.source))

    if (sources.size === 1) {
      items.forEach((item, index) => {
        const suffix = index === 0 ? '' : (index + 1).toString()
        const uniqueName = item.originalName + suffix
        schemas[uniqueName] = item.schema
        const refPath = item.refPath ?? `#/components/${item.source}/${item.originalName}`
        nameMapping.set(refPath, uniqueName)
      })
    } else {
      items.forEach((item) => {
        const suffix = getSemanticSuffix(item.source)
        const uniqueName = item.originalName + suffix
        schemas[uniqueName] = item.schema
        const refPath = item.refPath ?? `#/components/${item.source}/${item.originalName}`
        nameMapping.set(refPath, uniqueName)
      })
    }
  }

  return { schemas, nameMapping }
}
