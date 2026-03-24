import path from 'node:path'
import { pascalCase, URLPath } from '@internals/utils'
import type { Config } from '@kubb/core'
import { bundle, loadConfig } from '@redocly/openapi-core'
import yaml from '@stoplight/yaml'
import { isRef } from 'oas/types'
import OASNormalize from 'oas-normalize'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { isPlainObject, mergeDeep } from 'remeda'
import swagger2openapi from 'swagger2openapi'
import { MERGE_DEFAULT_TITLE, MERGE_DEFAULT_VERSION, MERGE_OPENAPI_VERSION, structuralKeys } from '../constants.ts'
import { Oas } from './Oas.ts'
import type { contentType, Document, SchemaObject } from './types.ts'

/**
 * Returns `true` when `doc` is a Swagger 2.0 document (no `openapi` key).
 *
 * @example
 * ```ts
 * if (isOpenApiV2Document(doc)) {
 *   // doc is OpenAPIV2.Document
 * }
 * ```
 */
export function isOpenApiV2Document(doc: unknown): doc is OpenAPIV2.Document {
  return !!doc && isPlainObject(doc) && !('openapi' in doc)
}

/**
 * Returns `true` when `doc` is an OpenAPI 3.x document (has an `openapi` key).
 *
 * @example
 * ```ts
 * if (isOpenApiV3Document(doc)) {
 *   // doc is OpenAPIV3.Document
 * }
 * ```
 */
export function isOpenApiV3Document(doc: unknown): doc is OpenAPIV3.Document {
  return !!doc && isPlainObject(doc) && 'openapi' in doc
}

/**
 * Returns `true` when `doc` is an OpenAPI 3.1 document (version string starts with `'3.1'`).
 *
 * @example
 * ```ts
 * if (isOpenApiV3_1Document(doc)) {
 *   // doc is OpenAPIV3_1.Document — use prefixItems, const, etc.
 * }
 * ```
 */
export function isOpenApiV3_1Document(doc: unknown): doc is OpenAPIV3_1.Document {
  return !!doc && isPlainObject(doc) && 'openapi' in (doc as object) && (doc as { openapi: string }).openapi.startsWith('3.1')
}

/**
 * Returns `true` when a schema should be treated as nullable.
 *
 * Recognises all nullable signals across OAS versions: `nullable: true` (OAS 3.0),
 * `x-nullable: true` (vendor extension), `type: 'null'`, and `type: ['null', ...]` (OAS 3.1).
 *
 * @example
 * ```ts
 * isNullable({ type: 'string', nullable: true }) // true
 * isNullable({ type: ['string', 'null'] })       // true
 * isNullable({ type: 'string' })                 // false
 * ```
 */
export function isNullable(schema?: SchemaObject & { 'x-nullable'?: boolean }): boolean {
  const explicitNullable = schema?.nullable ?? schema?.['x-nullable']
  if (explicitNullable === true) return true

  const schemaType = schema?.type
  if (schemaType === 'null') return true
  if (Array.isArray(schemaType)) return schemaType.includes('null')

  return false
}

/**
 * Returns `true` when `obj` is an OpenAPI `$ref` pointer object.
 *
 * @example
 * ```ts
 * isReference({ $ref: '#/components/schemas/Pet' }) // true
 * isReference({ type: 'string' })                  // false
 * ```
 */
export function isReference(obj?: unknown): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj as object)
}

/**
 * Returns `true` when `obj` is a schema with a structured OAS 3.x `discriminator` object.
 *
 * @example
 * ```ts
 * isDiscriminator({ discriminator: { propertyName: 'type', mapping: {} } }) // true
 * isDiscriminator({ discriminator: 'type' })                                 // false (Swagger 2 string form)
 * ```
 */
export function isDiscriminator(obj?: unknown): obj is SchemaObject & { discriminator: OpenAPIV3.DiscriminatorObject } {
  const record = obj as Record<string, unknown>
  return !!obj && !!record['discriminator'] && typeof record['discriminator'] !== 'string'
}

/**
 * Loads, dereferences, and wraps an OpenAPI document into an `Oas` instance.
 *
 * Accepts a file path or an already-parsed document object. File paths are bundled via Redocly
 * to resolve external `$ref`s. Swagger 2.0 documents are automatically up-converted to OAS 3.0.
 *
 * @example
 * ```ts
 * const oas = await parse('./openapi.yaml')
 * const oas = await parse(rawDocumentObject, { canBundle: false })
 * ```
 */
export async function parse(
  pathOrApi: string | Document,
  { oasClass = Oas, canBundle = true, enablePaths = true }: { oasClass?: typeof Oas; canBundle?: boolean; enablePaths?: boolean } = {},
): Promise<Oas> {
  if (typeof pathOrApi === 'string' && canBundle) {
    const config = await loadConfig()
    const bundleResults = await bundle({ ref: pathOrApi, config, base: pathOrApi })

    return parse(bundleResults.bundle.parsed as string, { oasClass, canBundle, enablePaths })
  }

  const oasNormalize = new OASNormalize(pathOrApi, {
    enablePaths,
    colorizeErrors: true,
  })
  const document = (await oasNormalize.load()) as Document

  if (isOpenApiV2Document(document)) {
    const { openapi } = await swagger2openapi.convertObj(document, {
      anchors: true,
    })

    return new oasClass(openapi as Document)
  }

  return new oasClass(document)
}

/**
 * Deep-merges multiple OpenAPI documents into a single `Oas` instance.
 *
 * Each document is parsed independently then recursively merged with `remeda`'s `mergeDeep`.
 * Throws when the input array is empty.
 *
 * @example
 * ```ts
 * const oas = await merge(['./pets.yaml', './orders.yaml'])
 * ```
 */
export async function merge(pathOrApi: Array<string | Document>, { oasClass = Oas }: { oasClass?: typeof Oas } = {}): Promise<Oas> {
  const instances = await Promise.all(pathOrApi.map((p) => parse(p, { oasClass, enablePaths: false, canBundle: false })))

  if (instances.length === 0) {
    throw new Error('No OAS instances provided for merging.')
  }

  const seed: Document = {
    openapi: MERGE_OPENAPI_VERSION,
    info: { title: MERGE_DEFAULT_TITLE, version: MERGE_DEFAULT_VERSION },
    paths: {},
    components: { schemas: {} },
  } as Document

  const merged = instances.reduce((acc, current) => mergeDeep(acc, current.document as Document), seed)

  return parse(merged, { oasClass })
}

/**
 * Creates an `Oas` instance from a Kubb `Config` object.
 *
 * Handles all three input forms: an inline `data` string or object, an array of file paths
 * (merged via `merge()`), or a single local path / remote URL.
 *
 * @example
 * ```ts
 * const oas = await parseFromConfig(config)
 * const oas = await parseFromConfig(config, MyCustomOas)
 * ```
 */
export function parseFromConfig(config: Config, oasClass: typeof Oas = Oas): Promise<Oas> {
  if ('data' in config.input) {
    if (typeof config.input.data === 'object') {
      return parse(structuredClone(config.input.data) as Document, { oasClass })
    }

    try {
      const api: string = yaml.parse(config.input.data as string)
      return parse(api, { oasClass })
    } catch {
      return parse(config.input.data as string, { oasClass })
    }
  }

  if (Array.isArray(config.input)) {
    return merge(
      config.input.map((input) => path.resolve(config.root, input.path)),
      { oasClass },
    )
  }

  if (new URLPath(config.input.path).isURL) {
    return parse(config.input.path, { oasClass })
  }

  return parse(path.resolve(config.root, config.input.path), { oasClass })
}

/**
 * Flattens a keyword-only `allOf` into its parent schema.
 *
 * Only flattens when every member is a plain fragment — no `$ref` and no structural keywords
 * (see `structuralKeys`). Outer schema values take precedence over fragment values.
 * Returns `null` for a `null` input, and the original schema unchanged when flattening is unsafe.
 *
 * @example
 * ```ts
 * flattenSchema({ allOf: [{ description: 'A pet' }], type: 'object', properties: {} })
 * // { type: 'object', properties: {}, description: 'A pet' }
 *
 * flattenSchema({ allOf: [{ $ref: '#/components/schemas/Pet' }] })
 * // returned unchanged — contains a $ref
 * ```
 */
export function flattenSchema(schema: SchemaObject | null): SchemaObject | null {
  if (!schema?.allOf || schema.allOf.length === 0) return schema ?? null
  if (schema.allOf.some((item) => isRef(item))) return schema

  const isPlainFragment = (item: SchemaObject) => !Object.keys(item).some((key) => structuralKeys.has(key as 'properties'))
  if (!schema.allOf.every((item) => isPlainFragment(item as SchemaObject))) return schema

  const merged: SchemaObject = { ...schema }
  delete merged.allOf

  for (const fragment of schema.allOf as SchemaObject[]) {
    for (const [key, value] of Object.entries(fragment)) {
      if (merged[key as keyof typeof merged] === undefined) {
        merged[key as keyof typeof merged] = value
      }
    }
  }

  return merged
}

/**
 * Validates an OpenAPI document using `oas-normalize` with colorized error output.
 *
 * @example
 * ```ts
 * await validate(oas.api)
 * ```
 */
export async function validate(document: Document) {
  const oasNormalize = new OASNormalize(document, {
    enablePaths: true,
    colorizeErrors: true,
  })

  return oasNormalize.validate({
    parser: {
      validate: {
        errors: { colorize: true },
      },
    },
  })
}

/**
 * The three component sections Kubb reads schemas from.
 */
type SchemaSourceMode = 'schemas' | 'responses' | 'requestBodies'

/**
 * A schema annotated with the component section it came from and its original name.
 *
 * Used during cross-source name-collision resolution in `resolveCollisions`.
 */
export type SchemaWithMetadata = {
  schema: SchemaObject
  source: SchemaSourceMode
  originalName: string
}

type GetSchemasResult = {
  schemas: Record<string, SchemaObject>
  nameMapping: Map<string, string>
}

/**
 * Walks a schema tree and collects the names of all `#/components/schemas/<name>` `$ref`s.
 */
function collectRefs(schema: unknown, refs = new Set<string>()): Set<string> {
  if (Array.isArray(schema)) {
    for (const item of schema) collectRefs(item, refs)
    return refs
  }

  if (schema && typeof schema === 'object') {
    for (const [key, value] of Object.entries(schema)) {
      if (key === '$ref' && typeof value === 'string') {
        const match = value.match(/^#\/components\/schemas\/(.+)$/)
        if (match) refs.add(match[1]!)
      } else {
        collectRefs(value, refs)
      }
    }
  }

  return refs
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
  const deps = new Map<string, string[]>()

  for (const [name, schema] of Object.entries(schemas)) {
    deps.set(name, Array.from(collectRefs(schema)))
  }

  const sorted: string[] = []
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

/**
 * Extracts the inline schema from a media-type `content` map.
 *
 * Prefers `preferredContentType` when given; otherwise uses the first key in the map.
 * Returns `null` when `content` is absent, the schema is missing, or the schema is a `$ref`.
 *
 * @example
 * ```ts
 * extractSchemaFromContent(operation.content, 'application/json')
 * // SchemaObject | null
 * ```
 */
export function extractSchemaFromContent(content: Record<string, unknown> | undefined, preferredContentType?: contentType): SchemaObject | null {
  if (!content) return null

  const firstContentType = Object.keys(content)[0] ?? 'application/json'
  const targetContentType = preferredContentType ?? firstContentType
  const contentSchema = content[targetContentType] as { schema?: SchemaObject } | undefined
  const schema = contentSchema?.schema

  if (schema && '$ref' in schema) return null
  return schema ?? null
}

/**
 * Returns the PascalCase suffix appended to a component name when resolving
 * cross-source name collisions (schemas vs. responses vs. requestBodies).
 */
const semanticSuffixes: Record<SchemaSourceMode, string> = {
  schemas: 'Schema',
  responses: 'Response',
  requestBodies: 'Request',
}

function getSemanticSuffix(source: SchemaSourceMode): string {
  return semanticSuffixes[source]
}

/**
 * Registers schemas without collision detection, each under its original component name.
 *
 * Used in legacy mode where all schema names are preserved as-is.
 *
 * @example
 * ```ts
 * const { schemas, nameMapping } = legacyResolve(schemasWithMeta)
 * nameMapping.get('#/components/schemas/Pet') // 'Pet'
 * ```
 */
export function legacyResolve(schemasWithMeta: SchemaWithMetadata[]): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()

  for (const item of schemasWithMeta) {
    schemas[item.originalName] = item.schema
    nameMapping.set(`#/components/${item.source}/${item.originalName}`, item.originalName)
  }

  return { schemas, nameMapping }
}

/**
 * Registers schemas with automatic name-collision resolution.
 *
 * When two schemas normalise to the same PascalCase name, a suffix is appended:
 * same source → numeric suffix (`2`, `3`, …); different sources → semantic suffix (`Schema`, `Response`, `Request`).
 *
 * @example
 * ```ts
 * const { schemas, nameMapping } = resolveCollisions(schemasWithMeta)
 * // 'Order' (schemas) and 'Order' (responses) → 'OrderSchema' / 'OrderResponse'
 * ```
 */
export function resolveCollisions(schemasWithMeta: SchemaWithMetadata[]): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()
  const normalizedNames = new Map<string, SchemaWithMetadata[]>()

  for (const item of schemasWithMeta) {
    const normalized = pascalCase(item.originalName)
    const bucket = normalizedNames.get(normalized) ?? []
    bucket.push(item)
    normalizedNames.set(normalized, bucket)
  }

  for (const [, items] of normalizedNames) {
    if (items.length === 1) {
      const item = items[0]!
      schemas[item.originalName] = item.schema
      nameMapping.set(`#/components/${item.source}/${item.originalName}`, item.originalName)
      continue
    }

    const sources = new Set(items.map((item) => item.source))

    if (sources.size === 1) {
      items.forEach((item, index) => {
        const uniqueName = item.originalName + (index === 0 ? '' : (index + 1).toString())
        schemas[uniqueName] = item.schema
        nameMapping.set(`#/components/${item.source}/${item.originalName}`, uniqueName)
      })
    } else {
      items.forEach((item) => {
        const uniqueName = item.originalName + getSemanticSuffix(item.source)
        schemas[uniqueName] = item.schema
        nameMapping.set(`#/components/${item.source}/${item.originalName}`, uniqueName)
      })
    }
  }

  return { schemas, nameMapping }
}
