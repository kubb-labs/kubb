import path from 'node:path'
import { pascalCase, URLPath } from '@internals/utils'
import type { Config } from '@kubb/core'
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import { parseJson, parseYaml, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { validate as scalarValidate, upgrade } from '@scalar/openapi-parser'
import type { ParameterObject, SchemaObject } from 'oas/types'
import { isRef, isSchema } from 'oas/types'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { isPlainObject, mergeDeep } from 'remeda'
import { Oas } from './Oas.ts'
import type { contentType, Document } from './types.ts'

export const STRUCTURAL_KEYS = new Set(['properties', 'items', 'additionalProperties', 'oneOf', 'anyOf', 'allOf', 'not'])

export function isOpenApiV2Document(doc: any): doc is OpenAPIV2.Document {
  return doc && isPlainObject(doc) && !('openapi' in doc)
}
export function isOpenApiV3Document(doc: any): doc is OpenAPIV3.Document {
  return doc && isPlainObject(doc) && 'openapi' in doc
}

export function isOpenApiV3_1Document(doc: any): doc is OpenAPIV3_1.Document {
  return doc && isPlainObject<OpenAPIV3_1.Document>(doc) && 'openapi' in doc && doc.openapi.startsWith('3.1')
}

export function isJSONSchema(obj?: unknown): obj is SchemaObject {
  return !!obj && isSchema(obj)
}

export function isParameterObject(obj: ParameterObject | SchemaObject): obj is ParameterObject {
  return obj && 'in' in obj
}

/**
 * Determines if a schema is nullable, considering:
 * - OpenAPI 3.0 `nullable` / `x-nullable`
 * - OpenAPI 3.1 JSON Schema `type: ['null', ...]` or `type: 'null'`
 */
export function isNullable(schema?: SchemaObject & { 'x-nullable'?: boolean }): boolean {
  const explicitNullable = schema?.nullable ?? schema?.['x-nullable']
  if (explicitNullable === true) {
    return true
  }

  const schemaType = schema?.type
  if (schemaType === 'null') {
    return true
  }
  if (Array.isArray(schemaType)) {
    return schemaType.includes('null')
  }

  return false
}

/**
 * Determines if the given object is an OpenAPI ReferenceObject.
 */
export function isReference(obj?: any): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj)
}

/**
 * Determines if the given object is a SchemaObject with a discriminator property of type DiscriminatorObject.
 */
export function isDiscriminator(obj?: any): obj is SchemaObject & { discriminator: OpenAPIV3.DiscriminatorObject } {
  return !!obj && obj?.['discriminator'] && typeof obj.discriminator !== 'string'
}

/**
 * Determines whether a schema is required.
 *
 * Returns true if the schema has a non-empty {@link SchemaObject.required} array or a truthy {@link SchemaObject.required} property.
 */
export function isRequired(schema?: SchemaObject): boolean {
  if (!schema) {
    return false
  }

  return Array.isArray(schema.required) ? !!schema.required?.length : !!schema.required
}

// Helper to determine if a schema (and its composed children) has no required fields
// This prefers structural optionality over top-level optional flag
type JSONSchemaLike =
  | {
      required?: readonly string[]
      allOf?: readonly unknown[]
      anyOf?: readonly unknown[]
      oneOf?: readonly unknown[]
    }
  | undefined

//TODO make isAllOptional more like isOptional with better typings
export function isAllOptional(schema: unknown): boolean {
  // If completely absent, consider it optional in context of defaults
  if (!schema) return true
  // If the entire schema itself is optional, it's safe to default
  if (isOptional(schema)) return true

  const s = schema as JSONSchemaLike
  const hasRequired = Array.isArray(s?.required) && s?.required.length > 0
  if (hasRequired) return false

  const groups = [s?.allOf, s?.anyOf, s?.oneOf].filter((g): g is readonly unknown[] => Array.isArray(g))
  if (groups.length === 0) return true

  // Be conservative: only when all composed parts are all-optional we treat it as all-optional
  return groups.every((arr) => arr.every((child) => isAllOptional(child)))
}

export function isOptional(schema?: SchemaObject): boolean {
  return !isRequired(schema)
}

/**
 * Determines the appropriate default value for a schema parameter.
 * - For array types: returns '[]'
 * - For union types (anyOf/oneOf):
 *   - If at least one variant has all-optional fields: returns '{}'
 *   - Otherwise: returns undefined (no default)
 * - For object types with optional fields: returns '{}'
 * - For primitive types (string, number, boolean): returns undefined (no default)
 * - For required types: returns undefined (no default)
 */
export function getDefaultValue(schema?: SchemaObject): string | undefined {
  if (!schema || !isOptional(schema)) {
    return undefined
  }

  // For array types, use empty array as default
  if (schema.type === 'array') {
    return '[]'
  }

  // For union types (anyOf/oneOf), check if any variant could accept an empty object
  if (schema.anyOf || schema.oneOf) {
    const variants = schema.anyOf || schema.oneOf
    if (!Array.isArray(variants)) {
      return undefined
    }
    // Only provide default if at least one variant has all-optional fields
    const hasEmptyObjectVariant = variants.some((variant) => isAllOptional(variant))
    if (!hasEmptyObjectVariant) {
      return undefined
    }
    // At least one variant accepts empty object
    return '{}'
  }

  // For object types (or schemas with properties), use empty object as default
  // This is safe because we already checked isOptional above
  if (schema.type === 'object' || schema.properties) {
    return '{}'
  }

  // For other types (primitives like string, number, boolean), no default
  return undefined
}

export async function parse(
  pathOrApi: string | Document,
  {
    oasClass = Oas,
    canBundle: _canBundle = true,
    enablePaths: _enablePaths = true,
  }: { oasClass?: typeof Oas; canBundle?: boolean; enablePaths?: boolean } = {},
): Promise<Oas> {
  let document: Document

  if (typeof pathOrApi === 'string') {
    const data = await bundle(pathOrApi, {
      plugins: [readFiles(), fetchUrls(), parseYaml(), parseJson()],
      treeShake: true,
      urlMap: true,
    })
    document = data as Document
  } else {
    document = pathOrApi
  }

  if (isOpenApiV2Document(document)) {
    const { specification } = upgrade(document)
    return parse(specification as unknown as string, { oasClass })
  }

  return new oasClass(document)
}

export async function merge(pathOrApi: Array<string | Document>, { oasClass = Oas }: { oasClass?: typeof Oas } = {}): Promise<Oas> {
  const instances = await Promise.all(pathOrApi.map((p) => parse(p, { oasClass, enablePaths: false, canBundle: false })))

  if (instances.length === 0) {
    throw new Error('No OAS instances provided for merging.')
  }

  const merged = instances.reduce(
    (acc, current) => {
      return mergeDeep(acc, current.document as Document)
    },
    {
      openapi: '3.0.0',
      info: {
        title: 'Merged API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {},
      },
    } as any,
  )

  return parse(merged, { oasClass })
}

export function parseFromConfig(config: Config, oasClass: typeof Oas = Oas): Promise<Oas> {
  if ('data' in config.input) {
    if (typeof config.input.data === 'object') {
      const api: Document = structuredClone(config.input.data) as Document

      return parse(api, { oasClass })
    }

    // data is a string (YAML or JSON) — load() handles both formats
    return parse(config.input.data as string, { oasClass })
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
 * Flatten allOf schemas by merging keyword-only fragments.
 * Only flattens schemas where allOf items don't contain structural keys or $refs.
 */
export function flattenSchema(schema: SchemaObject | null): SchemaObject | null {
  if (!schema?.allOf || schema.allOf.length === 0) {
    return schema || null
  }

  // Never touch ref-based or structural composition
  if (schema.allOf.some((item) => isRef(item))) {
    return schema
  }

  const isPlainFragment = (item: SchemaObject) => !Object.keys(item).some((key) => STRUCTURAL_KEYS.has(key))

  // Only flatten keyword-only fragments
  if (!schema.allOf.every((item) => isPlainFragment(item as SchemaObject))) {
    return schema
  }

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
 * Validate an OpenAPI document using @scalar/openapi-parser.
 */
export async function validate(document: Document) {
  const { valid, errors } = await scalarValidate(document)
  if (!valid) {
    throw new Error(errors?.map((e) => e.message).join('\n'))
  }
  return { valid, errors }
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

type GetSchemasResult = {
  schemas: Record<string, SchemaObject>
  nameMapping: Map<string, string>
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

  // Skip schemas that are just references - they don't define unique types
  if (schema && '$ref' in schema) {
    return null
  }

  return schema || null
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
 * Returns a Set of full ref strings like `#/x-ext/{hash}` or `#/x-ext/{hash}/components/schemas/Foo`.
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
 * - When the ref points to the root of the file (`#/x-ext/{hash}`), use the file basename.
 * - When the ref points to a named component (`#/x-ext/{hash}/components/schemas/User`), use the schema key (`User`).
 * - Otherwise fall back to the last path segment.
 *
 * @example deriveNameFromExtRef('#/x-ext/abc123', 'users.yaml')            // 'users'
 * @example deriveNameFromExtRef('#/x-ext/abc123/components/schemas/User', 'external.yaml') // 'User'
 */
export function deriveNameFromExtRef(ref: string, url: string | undefined): string {
  const segments = ref.replace(/^#\/x-ext\/[^/]+/, '').split('/').filter(Boolean)

  if (segments.length === 0) {
    return url ? deriveNameFromUrl(url) : ref.split('/').pop() || ref
  }

  // Named component path: /components/{type}/{name} — use the schema key
  if (segments.length >= 3 && segments[0] === 'components') {
    return segments[segments.length - 1]!
  }

  // Single segment or other paths — use the last meaningful segment
  return segments[segments.length - 1]!
}

/**
 * Legacy resolution strategy - no collision detection, just use original names.
 * This preserves backward compatibility when collisionDetection is false.
 * @deprecated
 */
export function legacyResolve(schemasWithMeta: SchemaWithMetadata[]): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()

  // Simply use original names without collision detection
  for (const item of schemasWithMeta) {
    schemas[item.originalName] = item.schema
    const refPath = item.refPath ?? `#/components/${item.source}/${item.originalName}`
    nameMapping.set(refPath, item.originalName)
  }

  return { schemas, nameMapping }
}

/**
 * Resolve name collisions by applying suffixes based on collision type.
 *
 * Strategy:
 * - Same-component collisions (e.g., "Variant" + "variant" both in schemas): numeric suffixes (Variant, Variant2)
 * - Cross-component collisions (e.g., "Pet" in schemas + "Pet" in requestBodies): semantic suffixes (PetSchema, PetRequest)
 */
export function resolveCollisions(schemasWithMeta: SchemaWithMetadata[]): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
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
      const refPath = item.refPath ?? `#/components/${item.source}/${item.originalName}`
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
        const refPath = item.refPath ?? `#/components/${item.source}/${item.originalName}`
        nameMapping.set(refPath, uniqueName)
      })
    } else {
      // Cross-component collision: add semantic suffixes
      // Preserve original order from OpenAPI spec for deterministic behavior
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
