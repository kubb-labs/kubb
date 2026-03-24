import { pascalCase } from '@internals/utils'
import type { ParameterObject } from 'oas/types'
import { isRef } from 'oas/types'
import { matchesMimeType } from 'oas/utils'
import { structuralKeys } from './constants.ts'
import { isReference } from './guards.ts'
import { dereferenceWithRef, resolveRef } from './refs.ts'
import type { contentType, Document, MediaTypeObject, Operation, ResponseObject, SchemaObject } from './types.ts'

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

/**
 * Builds a merged object schema from all parameters for a given location (`'path'`, `'query'`, or `'header'`).
 *
 * Query parameters with `style: form, explode: true` and only `additionalProperties` are flattened
 * to the root level. Returns `null` when no parameters exist for the requested location.
 *
 * @example
 * ```ts
 * getParametersSchema(document, operation, 'query')
 * // { type: 'object', properties: { status: { type: 'string' } }, required: [] }
 * ```
 */
export function getParametersSchema(
  document: Document,
  operation: Operation,
  inKey: 'path' | 'query' | 'header',
  options: OperationsOptions = {},
): SchemaObject | null {
  const resolvedContentType = options.contentType ?? operation.getContentType()

  const params = getParameters(document, operation).filter((v) => v.in === inKey)

  if (!params.length) {
    return null
  }

  return params.reduce(
    (schema, pathParameters) => {
      const property = (pathParameters.content?.[resolvedContentType]?.schema ?? (pathParameters.schema as SchemaObject)) as SchemaObject | null
      const required =
        typeof schema.required === 'boolean'
          ? schema.required
          : [...(schema.required || []), pathParameters.required ? pathParameters.name : undefined].filter(Boolean)

      const getDefaultStyle = (location: string): string => {
        if (location === 'query') return 'form'
        if (location === 'path') return 'simple'
        return 'simple'
      }
      const style = pathParameters.style || getDefaultStyle(inKey)
      const explode = pathParameters.explode !== undefined ? pathParameters.explode : style === 'form'

      if (inKey === 'query' && style === 'form' && explode === true && property?.type === 'object' && property?.additionalProperties && !property?.properties) {
        return {
          ...schema,
          description: pathParameters.description || schema.description,
          deprecated: schema.deprecated,
          example: property.example || schema.example,
          additionalProperties: property.additionalProperties,
        } as SchemaObject
      }

      return {
        ...schema,
        description: schema.description,
        deprecated: schema.deprecated,
        example: schema.example,
        required,
        properties: {
          ...schema.properties,
          [pathParameters.name]: {
            description: pathParameters.description,
            ...property,
          },
        },
      } as SchemaObject
    },
    { type: 'object', required: [], properties: {} } as SchemaObject,
  )
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

/**
 * Builds `GetSchemasResult` with automatic name-collision resolution.
 *
 * When two or more schemas normalize to the same PascalCase name:
 * - Same source → numeric suffix (`2`, `3`, …).
 * - Different sources → semantic suffix (`Schema`, `Response`, `Request`).
 *
 * @example
 * ```ts
 * const { schemas, nameMapping } = resolveNameCollisions(schemasWithMeta)
 * ```
 */
export function resolveNameCollisions(schemasWithMeta: Map<string, SchemaWithMetadata>): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()
  const normalizedNames = new Map<string, SchemaWithMetadata[]>()

  for (const item of schemasWithMeta.values()) {
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

/**
 * Collects component schemas from one or more sources and resolves name collisions.
 *
 * Sources default to `['schemas', 'requestBodies', 'responses']`. Returned schemas are
 * topologically sorted by `$ref` dependency so generators emit types in the correct order.
 *
 * @example
 * ```ts
 * const { schemas, nameMapping } = getSchemas(document, { contentType: 'application/json' })
 * ```
 */
export function getSchemas(document: Document, { contentType }: GetSchemasOptions): GetSchemasResult {
  const components = document.components
  const schemasWithMeta = new Map<string, SchemaWithMetadata>()

  const componentSchemas = components?.schemas || {}
  for (const [name, schemaObject] of Object.entries(componentSchemas)) {
    let schema = schemaObject
    if (isReference(schemaObject)) {
      const resolved = resolveRef<SchemaObject>(document, schemaObject.$ref)
      if (resolved && !isReference(resolved)) {
        schema = resolved
      }
    }
    schemasWithMeta.set(`schemas:${name}`, { schema, source: 'schemas', originalName: name })
  }

  const responses = components?.responses || {}
  for (const [name, response] of Object.entries(responses)) {
    const responseObject = response as ResponseObject
    const schema = extractSchemaFromContent(responseObject.content, contentType)
    if (schema) {
      let resolvedSchema = schema
      if (isReference(schema)) {
        const resolved = resolveRef<SchemaObject>(document, schema.$ref)
        if (resolved && !isReference(resolved)) {
          resolvedSchema = resolved
        }
      }
      schemasWithMeta.set(`responses:${name}`, { schema: resolvedSchema, source: 'responses', originalName: name })
    }
  }

  const requestBodies = components?.requestBodies || {}
  for (const [name, request] of Object.entries(requestBodies)) {
    const requestObject = request as { content?: Record<string, unknown> }
    const schema = extractSchemaFromContent(requestObject.content, contentType)
    if (schema) {
      let resolvedSchema = schema
      if (isReference(schema)) {
        const resolved = resolveRef<SchemaObject>(document, schema.$ref)
        if (resolved && !isReference(resolved)) {
          resolvedSchema = resolved
        }
      }
      schemasWithMeta.set(`requestBodies:${name}`, { schema: resolvedSchema, source: 'requestBodies', originalName: name })
    }
  }

  const { schemas, nameMapping } = resolveNameCollisions(schemasWithMeta)

  return {
    schemas: sortSchemas(schemas),
    nameMapping,
  }
}
