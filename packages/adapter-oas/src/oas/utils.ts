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
 * Narrows `doc` to a Swagger 2.0 document.
 * Swagger 2.0 documents do not have an `openapi` version key.
 */
export function isOpenApiV2Document(doc: unknown): doc is OpenAPIV2.Document {
  return !!doc && isPlainObject(doc) && !('openapi' in doc)
}

/**
 * Narrows `doc` to an OpenAPI 3.x document.
 * Any document that has an `openapi` key is considered 3.x (including 3.1).
 */
export function isOpenApiV3Document(doc: unknown): doc is OpenAPIV3.Document {
  return !!doc && isPlainObject(doc) && 'openapi' in doc
}

/**
 * Narrows `doc` to an OpenAPI 3.1 document by checking the version prefix.
 */
export function isOpenApiV3_1Document(doc: unknown): doc is OpenAPIV3_1.Document {
  return !!doc && isPlainObject(doc) && 'openapi' in (doc as object) && (doc as { openapi: string }).openapi.startsWith('3.1')
}

/**
 * Returns `true` when a schema should be treated as nullable.
 *
 * Covers three nullable signals across OAS versions:
 * - OAS 3.0: `nullable: true` or the vendor extension `x-nullable: true`.
 * - OAS 3.1 / JSON Schema: `type: 'null'` or `type: ['null', ...]` (multi-type array).
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
 * Narrows `obj` to an OpenAPI `$ref` pointer object.
 * Delegates to the `oas` package's own `isRef` helper.
 */
export function isReference(obj?: unknown): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj as object)
}

/**
 * Returns `true` when `obj` is a schema that carries a structured OAS 3.x `discriminator`
 * object — as opposed to a plain-string discriminator found in some Swagger 2 specs.
 */
export function isDiscriminator(obj?: unknown): obj is SchemaObject & { discriminator: OpenAPIV3.DiscriminatorObject } {
  const record = obj as Record<string, unknown>
  return !!obj && !!record['discriminator'] && typeof record['discriminator'] !== 'string'
}

/**
 * Loads, dereferences, and wraps a raw OpenAPI document into an `Oas` instance.
 *
 * When given a file path string with `canBundle: true` (the default), Redocly's
 * bundler resolves all external `$ref`s first. Swagger 2.0 documents are
 * automatically up-converted to OpenAPI 3.0 via `swagger2openapi`.
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
 * Each document is parsed independently (without path dereferencing) and then
 * recursively merged using `remeda`'s `mergeDeep`. The result is re-parsed so
 * the returned `Oas` instance is fully initialized.
 *
 * Throws when the input array is empty — at least one document is required.
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
 * Constructs an `Oas` instance from a Kubb `Config` object.
 *
 * Handles all three input forms supported by `Config`:
 * - `data` — an inline YAML string, JSON string, or pre-parsed object.
 * - Array — multiple file paths that are deep-merged via {@link merge}.
 * - `path` — a local file path or a remote URL.
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
 * Flattens a single-member or keyword-only `allOf` into its parent schema.
 *
 * Flattening is only performed when every `allOf` member is a "plain fragment" —
 * i.e. contains no structural composition keywords (see `structuralKeys`) and no
 * `$ref`. When any member carries structural meaning, the schema is returned unchanged.
 *
 * Keyword values from allOf members are merged into the parent on a first-write basis:
 * outer schema values always win over fragment values.
 */
export function flattenSchema(schema: SchemaObject | null): SchemaObject | null {
  if (!schema?.allOf || schema.allOf.length === 0) return schema ?? null
  if (schema.allOf.some((item) => isRef(item))) return schema

  const isPlainFragment = (item: SchemaObject) => !Object.keys(item).some((key) => structuralKeys.has(key))
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
 * Validates an OpenAPI document using `oas-normalize`.
 * Enables path validation and colorized error output.
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
 * Discriminates the three component sources Kubb reads schemas from.
 */
type SchemaSourceMode = 'schemas' | 'responses' | 'requestBodies'

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
 * Walks a schema tree and collects the names of all `#/components/schemas/<name>` refs.
 * Used by `sortSchemas` to build the dependency graph.
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
 * Schemas with no references come first; schemas that are referenced by others
 * come before those that reference them. This ensures code generators emit
 * referenced types before the types that depend on them.
 *
 * Cycles are silently skipped via the `stack` guard inside `visit`.
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
 * Prefers `preferredContentType` when provided; otherwise falls back to the
 * first key in the map. Returns `null` when:
 * - `content` is absent.
 * - The target content-type has no `schema` entry.
 * - The schema is a `$ref` (callers resolve refs separately).
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
function getSemanticSuffix(source: SchemaSourceMode): string {
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
 * Builds `GetSchemasResult` without any collision detection.
 * Each schema is registered under its original component name and its full
 * `#/components/<source>/<name>` ref path.
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
 * Builds `GetSchemasResult` with automatic name-collision resolution.
 *
 * When two or more schemas normalize to the same PascalCase name:
 * - If they share the same source, a numeric suffix (`2`, `3`, …) is appended.
 * - If they come from different sources (schemas / responses / requestBodies),
 *   a semantic suffix (`Schema`, `Response`, `Request`) is appended.
 *
 * Non-colliding schemas are left unchanged.
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
