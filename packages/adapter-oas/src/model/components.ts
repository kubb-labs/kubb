import { escapePointerToken, pascalCase } from '@internals/utils'
import { SCHEMA_REF_PREFIX } from '../constants.ts'
import { isReference } from '../oas.ts'
import type { Refs } from '../refs.ts'
import type { ContentType, Document, SchemaObject } from '../types.ts'

/**
 * The three component sections Kubb reads schemas from.
 */
type SchemaSourceMode = 'schemas' | 'responses' | 'requestBodies'

/**
 * A schema annotated with its component section source and original name. `getSchemas` uses this
 * to resolve name collisions across sources.
 */
type SchemaWithMetadata = {
  schema: SchemaObject
  source: SchemaSourceMode
  originalName: string
  pointer: string
  /**
   * Where the schema itself sits, when that differs from `pointer`, as for a response's `content` schema.
   */
  schemaPointer?: string
  nested?: boolean
}

type GetSchemasResult = {
  schemas: Record<string, SchemaObject>
  /**
   * The JSON pointer each key in `schemas` was read from.
   */
  pointers: Map<string, string>
  /**
   * Maps nested schema pointers and collision-renamed component pointers to the unique
   * names used as keys in `schemas`. Components with their original names and no nested
   * definitions are not recorded.
   */
  renames: Map<string, string>
}

/**
 * Extracts the inline schema from a media-type `content` map, with the media type it sits under.
 *
 * Prefers `preferredContentType` when given, otherwise uses the first key in the map.
 * Returns `null` when `content` is absent, the schema is missing, or the schema is a `$ref`.
 *
 * @example
 * ```ts
 * extractSchemaFromContent(operation.content, 'application/json')
 * // { schema: SchemaObject, contentType: 'application/json' } | null
 * ```
 */
function extractSchemaFromContent(
  content: Record<string, unknown> | undefined,
  preferredContentType?: ContentType,
): { schema: SchemaObject; contentType: string } | null {
  if (!content) return null

  const firstContentType = Object.keys(content)[0] ?? 'application/json'
  const targetContentType = preferredContentType ?? firstContentType
  const contentSchema = content[targetContentType] as { schema?: SchemaObject } | undefined
  const schema = contentSchema?.schema

  if (!schema || isReference(schema)) return null
  return { schema, contentType: targetContentType }
}

/**
 * Walks a schema tree and collects the names of all `#/components/schemas/<name>` `$ref`s.
 */
function* collectRefs(schema: unknown, renames: Map<string, string>): Generator<string, void, undefined> {
  if (Array.isArray(schema)) {
    for (const item of schema) yield* collectRefs(item, renames)
    return
  }

  if (schema && typeof schema === 'object') {
    for (const key in schema) {
      const value = (schema as Record<string, unknown>)[key]
      if (!(key === '$ref' && typeof value === 'string')) {
        yield* collectRefs(value, renames)
        continue
      }
      if (value.startsWith(SCHEMA_REF_PREFIX)) {
        const name = renames.get(value) ?? value.slice(SCHEMA_REF_PREFIX.length)
        if (name) yield name
      }
    }
  }
}

const schemaChildKeywords = [
  'additionalProperties',
  'allOf',
  'anyOf',
  'contains',
  'contentSchema',
  'else',
  'if',
  'items',
  'not',
  'oneOf',
  'patternProperties',
  'prefixItems',
  'properties',
  'propertyNames',
  'then',
] as const

/** Collects definitions only from schema locations, never from examples/defaults or arbitrary data. */
function* collectNestedDefinitions(
  schema: unknown,
  pointer: string,
  name: string,
): Generator<{ schema: SchemaObject; pointer: string; originalName: string }, void, undefined> {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return
  const value = schema as Record<string, unknown>

  for (const keyword of ['$defs', 'definitions'] as const) {
    const definitions = value[keyword]
    if (!definitions || typeof definitions !== 'object' || Array.isArray(definitions)) continue
    for (const [key, definition] of Object.entries(definitions)) {
      if (!definition || typeof definition !== 'object' || Array.isArray(definition)) continue
      const definitionPointer = `${pointer}/${keyword}/${escapePointerToken(key)}`
      const nestedName = `${name}_${key}`
      yield { schema: definition as SchemaObject, pointer: definitionPointer, originalName: nestedName }
      yield* collectNestedDefinitions(definition, definitionPointer, nestedName)
    }
  }

  for (const keyword of schemaChildKeywords) {
    const child = value[keyword]
    if (!child || typeof child !== 'object') continue
    if (Array.isArray(child)) {
      for (const [index, item] of child.entries()) yield* collectNestedDefinitions(item, `${pointer}/${keyword}/${index}`, name)
      continue
    }
    if (keyword === 'properties' || keyword === 'patternProperties') {
      for (const [key, item] of Object.entries(child)) yield* collectNestedDefinitions(item, `${pointer}/${keyword}/${escapePointerToken(key)}`, name)
      continue
    }
    yield* collectNestedDefinitions(child, `${pointer}/${keyword}`, name)
  }
}

/**
 * Returns a copy of `schemas` topologically sorted by `$ref` dependency.
 *
 * Referenced schemas appear before the schemas that depend on them, so code generators
 * can emit types in the correct order. Cycles are silently skipped.
 *
 * @example
 * ```ts
 * const sorted = sortSchemas({ Order: orderSchema, Pet: petSchema })
 * // Pet appears before Order when Order.$ref points at Pet
 * ```
 */
function sortSchemas(schemas: Record<string, SchemaObject>, renames: Map<string, string>): Record<string, SchemaObject> {
  const deps = new Map<string, Array<string>>()

  for (const [name, schema] of Object.entries(schemas)) {
    deps.set(name, [...new Set(collectRefs(schema, renames))])
  }

  const sorted: Array<string> = []
  const visited = new Set<string>()

  function visit(name: string, stack: Set<string>) {
    if (visited.has(name) || stack.has(name)) return
    stack.add(name)
    for (const child of deps.get(name) ?? []) {
      if (deps.has(child)) visit(child, stack)
    }
    stack.delete(name)
    visited.add(name)
    sorted.push(name)
  }

  for (const name of Object.keys(schemas)) {
    visit(name, new Set())
  }

  const result: Record<string, SchemaObject> = {}
  for (const name of sorted) result[name] = schemas[name]!
  return result
}

const semanticSuffixes: Record<SchemaSourceMode, string> = {
  schemas: 'Schema',
  responses: 'Response',
  requestBodies: 'Request',
}

/**
 * Collects component schemas from one or more sources and resolves name collisions.
 *
 * Sources default to `['schemas', 'requestBodies', 'responses']`. Returned schemas are
 * topologically sorted by `$ref` dependency so generators emit types in the correct order.
 *
 * When two or more schemas normalize to the same PascalCase name:
 * - Same source → numeric suffix (`2`, `3`, …).
 * - Different sources → semantic suffix (`Schema`, `Response`, `Request`).
 *
 * @example
 * ```ts
 * const { schemas, renames } = getSchemas(document, { contentType: 'application/json' }, refs)
 * ```
 */
export function getSchemas(document: Document, { contentType }: { contentType?: ContentType }, refs: Refs): GetSchemasResult {
  const components = document.components

  function resolveSchemaRef(schema: SchemaObject): SchemaObject {
    if (!isReference(schema)) return schema
    const resolved = refs.resolve<SchemaObject>(schema.$ref)
    return resolved && !isReference(resolved) ? resolved : schema
  }

  const candidates: Array<SchemaWithMetadata> = [
    ...Object.entries((components?.schemas as Record<string, SchemaObject>) ?? {}).flatMap(([name, schema]) => {
      const pointer = `#/components/schemas/${escapePointerToken(name)}`
      return [
        { schema: resolveSchemaRef(schema), source: 'schemas' as const, originalName: name, pointer },
        ...[...collectNestedDefinitions(schema, pointer, name)].map((nested) => ({
          ...nested,
          source: 'schemas' as const,
          nested: true,
        })),
      ]
    }),
    ...(['responses', 'requestBodies'] as const).flatMap((source) =>
      Object.entries(components?.[source] ?? {}).flatMap(([name, item]) => {
        const extracted = extractSchemaFromContent((item as { content?: Record<string, unknown> }).content, contentType)
        if (!extracted) return []
        const pointer = `#/components/${source}/${escapePointerToken(name)}`
        return [
          {
            schema: resolveSchemaRef(extracted.schema),
            source,
            originalName: name,
            pointer,
            schemaPointer: `${pointer}/content/${escapePointerToken(extracted.contentType)}/schema`,
          },
        ]
      }),
    ),
  ]

  const normalizedNames = new Map<string, Array<SchemaWithMetadata>>()
  for (const item of candidates) {
    const key = pascalCase(item.originalName)
    const bucket = normalizedNames.get(key) ?? []
    bucket.push(item)
    normalizedNames.set(key, bucket)
  }

  const schemas: Record<string, SchemaObject> = {}
  const renames = new Map<string, string>()
  const pointers = new Map<string, string>()

  for (const [, items] of normalizedNames) {
    const isSingle = items.length === 1
    const hasMultipleSources = !isSingle && new Set(items.map((item) => item.source)).size > 1

    items.forEach((item, index) => {
      // Unique names keep theirs. A collision across sources gets a semantic suffix, within one source a numeric one.
      const suffix = isSingle ? '' : hasMultipleSources ? semanticSuffixes[item.source] : index ? String(index + 1) : ''
      const uniqueName = item.originalName + suffix
      schemas[uniqueName] = item.schema
      pointers.set(uniqueName, item.schemaPointer ?? item.pointer)
      if (suffix || item.nested) renames.set(item.pointer, uniqueName)
    })
  }

  return { schemas: sortSchemas(schemas, renames), renames, pointers }
}
