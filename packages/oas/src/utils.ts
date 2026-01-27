import path from 'node:path'
import type { Config } from '@kubb/core'
import { pascalCase } from '@kubb/core/transformers'
import { URLPath } from '@kubb/core/utils'
import yaml from '@stoplight/yaml'
import type { ParameterObject, SchemaObject } from 'oas/types'
import { isRef, isSchema } from 'oas/types'
import OASNormalize from 'oas-normalize'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { isPlainObject, mergeDeep } from 'remeda'
import swagger2openapi from 'swagger2openapi'
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
  { oasClass = Oas, canBundle = true, enablePaths = true }: { oasClass?: typeof Oas; canBundle?: boolean; enablePaths?: boolean } = {},
): Promise<Oas> {
  const { loadConfig, bundle } = await import('@redocly/openapi-core')

  if (typeof pathOrApi === 'string' && canBundle) {
    // resolve external refs
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

    // data is a string - try YAML first, then fall back to passing to parse()
    try {
      const api: string = yaml.parse(config.input.data as string)
      return parse(api, { oasClass })
    } catch (_e) {
      // YAML parse failed, let parse() handle it (supports JSON strings and more)
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
 * Validate an OpenAPI document using oas-normalize.
 */
export async function validate(document: Document) {
  const oasNormalize = new OASNormalize(document, {
    enablePaths: true,
    colorizeErrors: true,
  })

  return oasNormalize.validate({
    parser: {
      validate: {
        errors: {
          colorize: true,
        },
      },
    },
  })
}

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
 * Sort schemas topologically so referenced schemas appear first.
 */
export function sortSchemas(schemas: Record<string, SchemaObject>): Record<string, SchemaObject> {
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

  const sortedSchemas: Record<string, SchemaObject> = {}
  for (const name of sorted) {
    sortedSchemas[name] = schemas[name]!
  }
  return sortedSchemas
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
  }
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
    // Map using full $ref path for consistency
    const refPath = `#/components/${item.source}/${item.originalName}`
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
