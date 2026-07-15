import { pascalCase } from '@internals/utils'
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
}

export type GetSchemasOptions = {
  contentType?: ContentType
}

export type GetSchemasResult = {
  schemas: Record<string, SchemaObject>
  /**
   * Maps a renamed component pointer (`#/components/<source>/<name>`) to the
   * collision-resolved unique name used as the key in `schemas`. Components that keep
   * their original name are not recorded, so the map stays empty for documents
   * without collisions.
   */
  renames: Map<string, string>
}

/**
 * Extracts the inline schema from a media-type `content` map.
 *
 * Prefers `preferredContentType` when given, otherwise uses the first key in the map.
 * Returns `null` when `content` is absent, the schema is missing, or the schema is a `$ref`.
 *
 * @example
 * ```ts
 * extractSchemaFromContent(operation.content, 'application/json')
 * // SchemaObject | null
 * ```
 */
export function extractSchemaFromContent(content: Record<string, unknown> | undefined, preferredContentType?: ContentType): SchemaObject | null {
  if (!content) return null

  const firstContentType = Object.keys(content)[0] ?? 'application/json'
  const targetContentType = preferredContentType ?? firstContentType
  const contentSchema = content[targetContentType] as { schema?: SchemaObject } | undefined
  const schema = contentSchema?.schema

  if (schema && '$ref' in schema) return null
  return schema ?? null
}

/**
 * Walks a schema tree and collects the names of all `#/components/schemas/<name>` `$ref`s.
 */
function* collectRefs(schema: unknown): Generator<string, void, undefined> {
  if (Array.isArray(schema)) {
    for (const item of schema) yield* collectRefs(item)
    return
  }

  if (schema && typeof schema === 'object') {
    for (const key in schema) {
      const value = (schema as Record<string, unknown>)[key]
      if (!(key === '$ref' && typeof value === 'string')) {
        yield* collectRefs(value)
        continue
      }
      if (value.startsWith(SCHEMA_REF_PREFIX)) {
        const name = value.slice(SCHEMA_REF_PREFIX.length)
        if (name) yield name
      }
    }
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
export function sortSchemas(schemas: Record<string, SchemaObject>): Record<string, SchemaObject> {
  const deps = new Map<string, Array<string>>()

  for (const [name, schema] of Object.entries(schemas)) {
    deps.set(name, [...new Set(collectRefs(schema))])
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
export function getSchemas(document: Document, { contentType }: GetSchemasOptions, refs: Refs): GetSchemasResult {
  const components = document.components

  function resolveSchemaRef(schema: SchemaObject): SchemaObject {
    if (!isReference(schema)) return schema
    const resolved = refs.resolve<SchemaObject>(schema.$ref)
    return resolved && !isReference(resolved) ? resolved : schema
  }

  const candidates: Array<SchemaWithMetadata> = [
    ...Object.entries((components?.schemas as Record<string, SchemaObject>) ?? {}).map(([name, schema]) => ({
      schema: resolveSchemaRef(schema),
      source: 'schemas' as const,
      originalName: name,
    })),
    ...(['responses', 'requestBodies'] as const).flatMap((source) =>
      Object.entries(components?.[source] ?? {}).flatMap(([name, item]) => {
        const schema = extractSchemaFromContent((item as { content?: Record<string, unknown> }).content, contentType)
        return schema
          ? [
              {
                schema: resolveSchemaRef(schema),
                source,
                originalName: name,
              },
            ]
          : []
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

  for (const [, items] of normalizedNames) {
    const isSingle = items.length === 1
    let hasMultipleSources = false
    if (!isSingle) {
      const firstSource = items[0]!.source
      for (const item of items) {
        if (item.source !== firstSource) {
          hasMultipleSources = true
          break
        }
      }
    }

    items.forEach((item, index) => {
      const suffix = isSingle ? '' : hasMultipleSources ? semanticSuffixes[item.source] : index === 0 ? '' : String(index + 1)
      const uniqueName = item.originalName + suffix
      schemas[uniqueName] = item.schema
      if (suffix) renames.set(`#/components/${item.source}/${item.originalName}`, uniqueName)
    })
  }

  return { schemas: sortSchemas(schemas), renames }
}
