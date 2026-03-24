import { pascalCase } from '@internals/utils'
import { mediaTypes } from '@kubb/ast'
import type { MediaType, ParserOptions, PrimitiveSchemaType, SchemaType } from '@kubb/ast/types'
import type { ParameterObject, ServerObject } from 'oas/types'
import { isRef } from 'oas/types'
import { matchesMimeType } from 'oas/utils'
import { formatMap, structuralKeys } from './constants.ts'
import { isReference } from './guards.ts'
import { dereferenceWithRef, resolveRef } from './refs.ts'
import type { contentType, Document, MediaTypeObject, Operation, ResponseObject, SchemaObject } from './types.ts'

/**
 * Resolves `{variable}` placeholders in an OpenAPI server URL.
 *
 * Resolution order per variable: `overrides[key]` → `variable.default` → left unreplaced.
 * Throws when an override value is not in the variable's allowed `enum` list.
 *
 * @example
 * ```ts
 * resolveServerUrl(
 *   { url: 'https://{env}.api.example.com', variables: { env: { default: 'dev', enum: ['dev', 'prod'] } } },
 *   { env: 'prod' },
 * )
 * // 'https://prod.api.example.com'
 * ```
 */
export function resolveServerUrl(server: ServerObject, overrides?: Record<string, string>): string {
  if (!server.variables) {
    return server.url
  }

  let url = server.url
  for (const [key, variable] of Object.entries(server.variables)) {
    const value = overrides?.[key] ?? (variable.default != null ? String(variable.default) : undefined)
    if (value === undefined) {
      continue
    }

    if (variable.enum?.length && !variable.enum.some((e) => String(e) === value)) {
      throw new Error(`Invalid server variable value '${value}' for '${key}' when resolving ${server.url}. Valid values are: ${variable.enum.join(', ')}.`)
    }

    url = url.replaceAll(`{${key}}`, value)
  }

  return url
}

/**
 * Looks up the Kubb `SchemaType` for a given OAS `format` string.
 * Returns `undefined` for formats not in `formatMap` (e.g. `int64`, `date-time`),
 * which are handled separately because their output depends on parser options.
 */
export function getSchemaType(format: string): SchemaType | null {
  return formatMap[format as keyof typeof formatMap] ?? null
}

/**
 * Maps an OAS primitive type string to its `PrimitiveSchemaType` equivalent.
 * Numeric types (`number`, `integer`, `bigint`) are returned unchanged;
 * `boolean` maps to `'boolean'`; everything else defaults to `'string'`.
 */
export function getPrimitiveType(type: string | undefined): PrimitiveSchemaType {
  if (type === 'number' || type === 'integer' || type === 'bigint') return type
  if (type === 'boolean') return 'boolean'

  return 'string'
}

/**
 * Narrows a raw content-type string to the `MediaType` union recognized by Kubb.
 * Returns `undefined` for content types not present in `KNOWN_MEDIA_TYPES`.
 */
export function getMediaType(contentType: string): MediaType | null {
  return Object.values(mediaTypes).includes(contentType as MediaType) ? (contentType as MediaType) : null
}

export type OperationsOptions = {
  contentType?: contentType
}

/**
 * Returns all resolved parameters for an operation, merging path-level and operation-level entries.
 *
 * Operation-level parameters take precedence over path-level ones with the same `in:name` key.
 * `$ref` parameters are resolved via `dereferenceWithRef` to restore backward compatibility
 * with `oas` v31+ which otherwise filters them out.
 *
 * @example
 * ```ts
 * getParameters(document, operation)
 * // [{ name: 'petId', in: 'path', required: true, schema: { type: 'integer' } }]
 * ```
 */
export function getParameters(document: Document, operation: Operation): Array<ParameterObject> {
  const resolveParams = (params: unknown[]): Array<ParameterObject> =>
    params.map((p) => dereferenceWithRef(document, p)).filter((p): p is ParameterObject => !!p && typeof p === 'object' && 'in' in p && 'name' in p)

  const operationParams = resolveParams(operation.schema?.parameters || [])
  const pathItem = document.paths?.[operation.path]
  const pathLevelParams = resolveParams(pathItem && !isReference(pathItem) && pathItem.parameters ? pathItem.parameters : [])

  const paramMap = new Map<string, ParameterObject>()
  for (const p of pathLevelParams) {
    if (p.name && p.in) {
      paramMap.set(`${p.in}:${p.name}`, p)
    }
  }
  for (const p of operationParams) {
    if (p.name && p.in) {
      paramMap.set(`${p.in}:${p.name}`, p)
    }
  }

  return Array.from(paramMap.values())
}

function getResponseBody(responseBody: boolean | ResponseObject, contentType?: string): MediaTypeObject | false | [string, MediaTypeObject, ...string[]] {
  if (!responseBody) return false
  if (isReference(responseBody)) return false

  const body = responseBody as ResponseObject
  if (!body.content) return false

  if (contentType) {
    if (!(contentType in body.content)) return false
    return body.content[contentType]!
  }

  let availableContentType: string | undefined
  const contentTypes = Object.keys(body.content)
  contentTypes.forEach((mt: string) => {
    if (!availableContentType && matchesMimeType.json(mt)) {
      availableContentType = mt
    }
  })

  if (!availableContentType) {
    contentTypes.forEach((mt: string) => {
      if (!availableContentType) availableContentType = mt
    })
  }

  if (availableContentType) {
    return [availableContentType, body.content[availableContentType]!, ...(body.description ? [body.description] : [])]
  }

  return false
}

/**
 * Returns the response schema for a given operation and HTTP status code.
 *
 * Returns an empty object `{}` when no response body schema is available.
 *
 * @example
 * ```ts
 * getResponseSchema(document, operation, 200)         // SchemaObject
 * getResponseSchema(document, operation, '4XX')       // {}
 * ```
 */
export function getResponseSchema(document: Document, operation: Operation, statusCode: string | number, options: OperationsOptions = {}): SchemaObject {
  if (operation.schema.responses) {
    Object.keys(operation.schema.responses).forEach((key) => {
      const schema = operation.schema.responses![key]
      const $ref = isReference(schema) ? schema.$ref : undefined

      if (schema && $ref) {
        operation.schema.responses![key] = resolveRef<any>(document, $ref)
      }
    })
  }

  const responseBody = getResponseBody(operation.getResponseByStatusCode(statusCode), options.contentType)

  if (responseBody === false) {
    return {}
  }

  const schema = Array.isArray(responseBody) ? responseBody[1].schema : responseBody.schema

  if (!schema) {
    return {}
  }

  return dereferenceWithRef(document, schema)
}

/**
 * Returns the request body schema for an operation, or `undefined` when absent.
 *
 * @example
 * ```ts
 * getRequestSchema(document, operation) // SchemaObject | undefined
 * ```
 */
export function getRequestSchema(document: Document, operation: Operation, options: OperationsOptions = {}): SchemaObject | undefined {
  if (operation.schema.requestBody) {
    operation.schema.requestBody = dereferenceWithRef(document, operation.schema.requestBody)
  }

  const requestBody = operation.getRequestBody(options.contentType)

  if (requestBody === false) {
    return undefined
  }

  const schema = Array.isArray(requestBody) ? requestBody[1].schema : requestBody.schema

  if (!schema) {
    return undefined
  }

  return dereferenceWithRef(document, schema)
}

/**
 * The three component sections Kubb reads schemas from.
 */
type SchemaSourceMode = 'schemas' | 'responses' | 'requestBodies'

/**
 * A schema annotated with the component section it came from and its original name.
 *
 * Used during cross-source name-collision resolution in `resolveNameCollisions`.
 */
export type SchemaWithMetadata = {
  schema: SchemaObject
  source: SchemaSourceMode
  originalName: string
}

export type GetSchemasOptions = {
  contentType?: contentType
}

export type GetSchemasResult = {
  schemas: Record<string, SchemaObject>
  nameMapping: Map<string, string>
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

const semanticSuffixes: Record<SchemaSourceMode, string> = {
  schemas: 'Schema',
  responses: 'Response',
  requestBodies: 'Request',
}

function getSemanticSuffix(source: SchemaSourceMode): string {
  return semanticSuffixes[source]
}

function resolveSchemaRef(document: Document, schema: SchemaObject): SchemaObject {
  if (!isReference(schema)) return schema
  const resolved = resolveRef<SchemaObject>(document, schema.$ref)
  return resolved && !isReference(resolved) ? resolved : schema
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
 * const { schemas, nameMapping } = getSchemas(document, { contentType: 'application/json' })
 * ```
 */
export function getSchemas(document: Document, { contentType }: GetSchemasOptions): GetSchemasResult {
  const components = document.components

  const candidates: SchemaWithMetadata[] = [
    ...Object.entries((components?.schemas as Record<string, SchemaObject>) ?? {}).map(([name, schema]) => ({
      schema: resolveSchemaRef(document, schema),
      source: 'schemas' as const,
      originalName: name,
    })),
    ...(['responses', 'requestBodies'] as const).flatMap((source) =>
      Object.entries(components?.[source] ?? {}).flatMap(([name, item]) => {
        const schema = extractSchemaFromContent((item as { content?: Record<string, unknown> }).content, contentType)
        return schema ? [{ schema: resolveSchemaRef(document, schema), source, originalName: name }] : []
      }),
    ),
  ]

  const normalizedNames = new Map<string, SchemaWithMetadata[]>()
  for (const item of candidates) {
    const key = pascalCase(item.originalName)
    const bucket = normalizedNames.get(key) ?? []
    bucket.push(item)
    normalizedNames.set(key, bucket)
  }

  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()
  const multipleSources = (items: SchemaWithMetadata[]) => new Set(items.map((i) => i.source)).size > 1

  for (const [, items] of normalizedNames) {
    items.forEach((item, index) => {
      const suffix = items.length === 1 ? '' : multipleSources(items) ? getSemanticSuffix(item.source) : index === 0 ? '' : String(index + 1)
      const uniqueName = item.originalName + suffix
      schemas[uniqueName] = item.schema
      nameMapping.set(`#/components/${item.source}/${item.originalName}`, uniqueName)
    })
  }

  return { schemas: sortSchemas(schemas), nameMapping }
}

/**
 * Resolves the AST type descriptor for a date/time format, honoring the `dateType` option.
 * Returns `undefined` when `dateType: false`, signalling the format should fall through to `string`.
 */
export function getDateType(
  options: ParserOptions,
  format: 'date-time' | 'date' | 'time',
): { type: 'datetime'; offset?: boolean; local?: boolean } | { type: 'date' | 'time'; representation: 'date' | 'string' } | null {
  if (!options.dateType) {
    return null
  }

  if (format === 'date-time') {
    if (options.dateType === 'date') {
      return { type: 'date', representation: 'date' }
    }
    if (options.dateType === 'stringOffset') {
      return { type: 'datetime', offset: true }
    }
    if (options.dateType === 'stringLocal') {
      return { type: 'datetime', local: true }
    }
    return { type: 'datetime', offset: false }
  }

  if (format === 'date') {
    return { type: 'date', representation: options.dateType === 'date' ? 'date' : 'string' }
  }

  // time
  return { type: 'time', representation: options.dateType === 'date' ? 'date' : 'string' }
}

/**
 * Collects the shared metadata fields passed to every `createSchema` call.
 */
export function buildSchemaNode(schema: SchemaObject, name: string | null | undefined, nullable: true | undefined, defaultValue: unknown) {
  return {
    name,
    nullable,
    title: schema.title,
    description: schema.description,
    deprecated: schema.deprecated,
    readOnly: schema.readOnly,
    writeOnly: schema.writeOnly,
    default: defaultValue,
    example: schema.example,
  } as const
}
