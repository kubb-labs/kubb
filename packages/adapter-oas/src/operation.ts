import { pascalCase } from '@internals/utils'
import { ast } from '@kubb/kit'
import { SUPPORTED_METHODS } from './constants.ts'
import type { ParseFn } from './emit/parseSchema.ts'
import { getBinaryFallbackSchema, isJsonMimeType, isReference } from './oas.ts'
import type { Refs } from './refs.ts'
import type {
  ContentType,
  Document,
  MediaTypeObject,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from './types.ts'

/**
 * A single OpenAPI operation: its path, method, raw operation object and resolved path item.
 */
export type Operation = {
  path: string
  method: string
  schema: OperationObject
  pathItem: PathItemObject
}

type OperationContext = {
  operation: Operation
  refs: Refs
}

/** What `parseOperation` needs beyond the operation. */
export type OperationParseContext = {
  refs: Refs
  contentType?: ContentType
  options: ast.ParserOptions
  parseSchema: ParseFn
}

function slugify(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Returns the operation's `operationId`, falling back to `<method>_<slugified-path>` when absent.
 */
export function getOperationId({ path, method, schema }: Operation): string {
  const { operationId } = schema
  if (typeof operationId === 'string' && operationId.length > 0) {
    return operationId
  }

  return `${method}_${slugify(path).toLowerCase()}`
}

/**
 * Returns the declared response status codes, skipping `x-` extensions and non-object entries.
 */
export function getResponseStatusCodes({ schema }: Operation): Array<string> {
  const responses = schema.responses as Record<string, unknown> | undefined
  if (!responses || isReference(responses)) {
    return []
  }

  return Object.keys(responses).filter((key) => !key.startsWith('x-') && !!responses[key] && typeof responses[key] === 'object')
}

/**
 * Returns the response object for a status code, resolving a `$ref` through `refs`. `null` when absent.
 */
export function getResponseByStatusCode({ operation, refs, statusCode }: OperationContext & { statusCode: string | number }): ResponseObject | null {
  const responses = operation.schema.responses as Record<string, ResponseObject | ReferenceObject> | undefined
  if (!responses || isReference(responses)) {
    return null
  }

  return refs.deref<ResponseObject>(responses[statusCode])
}

/**
 * Resolves the operation's request body, dereferencing a `$ref` through `refs`. Returns `null`
 * when the operation has no request body or it cannot be resolved.
 */
export function getRequestBody({ operation, refs }: OperationContext): RequestBodyObject | null {
  return refs.deref<RequestBodyObject>(operation.schema.requestBody)
}

/**
 * Returns the primary request content type. Prefers a JSON-like media type (the last one wins
 * when several are declared), then the first declared one, defaulting to `'application/json'`.
 */
export function getRequestContentType({ operation, refs }: OperationContext): string {
  const content = getRequestBody({ operation, refs })?.content
  const mediaTypes = content ? Object.keys(content) : []

  return mediaTypes.findLast(isJsonMimeType) ?? mediaTypes[0] ?? 'application/json'
}

/** Merges path-level and operation-level parameters; operation-level wins per `in:name`. */
export function getParameters({ operation, refs }: OperationContext): Array<ParameterObject> {
  const resolveParams = (params: Array<unknown>): Array<ParameterObject> =>
    params.map((p) => refs.derefKeepingRef(p)).filter((p): p is ParameterObject => !!p && typeof p === 'object' && 'in' in p && 'name' in p)

  const operationParams = resolveParams(operation.schema?.parameters || [])
  const pathLevelParams = resolveParams((operation.pathItem as { parameters?: Array<unknown> }).parameters ?? [])

  const paramMap = new Map<string, ParameterObject>()
  for (const p of [...pathLevelParams, ...operationParams]) {
    if (p.name && p.in) {
      paramMap.set(`${p.in}:${p.name}`, p)
    }
  }

  return Array.from(paramMap.values())
}

/** Schema for one media type of a `content` map, with the binary fallback for an emptied non-JSON entry. */
export function getBodySchema({
  content,
  contentType,
  refs,
}: {
  content: Record<string, MediaTypeObject> | undefined
  contentType: string | undefined
  refs: Refs
}): SchemaObject | null {
  const entry = contentType ? content?.[contentType] : undefined
  if (!entry) return null

  const binary = getBinaryFallbackSchema(contentType, entry.schema)
  if (binary) return binary

  return entry.schema ? refs.derefKeepingRef(entry.schema as SchemaObject) : null
}

/**
 * Builds an `Operation` for every supported HTTP method on every path, in document order.
 * `x-` path keys and unresolvable path-item `$ref`s are skipped.
 */
export function getOperations(document: Document, refs: Refs): Array<Operation> {
  const operations: Array<Operation> = []
  const paths = document.paths
  if (!paths) {
    return operations
  }

  for (const path of Object.keys(paths)) {
    if (path.startsWith('x-')) {
      continue
    }

    const pathItem = refs.deref<PathItemObject>(paths[path])
    if (!pathItem) {
      continue
    }

    const item = pathItem as unknown as Record<string, unknown>
    for (const method of Object.keys(item)) {
      if (!SUPPORTED_METHODS.has(method)) {
        continue
      }
      const schema = item[method]
      if (!schema || typeof schema !== 'object') {
        continue
      }
      operations.push({ path, method, schema: schema as OperationObject, pathItem })
    }
  }

  return operations
}

// Property names whose schema has a truthy `readOnly` or `writeOnly` flag; `$ref` entries are skipped.
function collectPropertyKeysByFlag(schema: SchemaObject | null, flag: 'readOnly' | 'writeOnly'): Array<string> | null {
  if (!schema?.properties) return null

  const keys: Array<string> = []
  for (const key in schema.properties) {
    const prop = schema.properties[key]
    if (prop && !isReference(prop) && (prop as Record<string, unknown>)[flag]) {
      keys.push(key)
    }
  }
  return keys.length ? keys : null
}

function parseParameter({
  param,
  parentName,
  options,
  parseSchema,
}: OperationParseContext & { param: ParameterObject; parentName?: string }): ast.ParameterNode {
  const schemaName = parentName && param.name ? pascalCase(`${parentName} ${param.name}`) : undefined
  const schema: ast.SchemaNode = param.schema
    ? parseSchema({ schema: param.schema as SchemaObject, name: schemaName })
    : ast.factory.createSchema({ type: options.unknownType })
  const style = param.style as ast.ParameterStyle | undefined
  const explode = param.explode

  return ast.factory.createParameter({
    name: param.name,
    in: param.in,
    schema: {
      ...schema,
      description: param.description ?? schema.description,
    },
    required: param.required ?? false,
    ...(style !== undefined ? { style } : {}),
    ...(explode !== undefined ? { explode } : {}),
  })
}

/**
 * Converts an OAS `Operation` into an `OperationNode`.
 */
export function parseOperation({ operation, ...ctx }: OperationParseContext & { operation: Operation }): ast.OperationNode {
  const { refs, contentType, options, parseSchema } = ctx
  const operationId = getOperationId(operation)
  const operationName = operationId ? pascalCase(operationId) : undefined
  const parameters = getParameters({ operation, refs }).map((param) => parseParameter({ ...ctx, param, parentName: operationName }))

  // A configured contentType restricts the body to that one media type; otherwise every declared one is kept.
  const body = getRequestBody({ operation, refs })
  const bodyRequired = body?.required === true
  const requestBodyName = operationName ? `${operationName}Request` : undefined
  const requestContentTypes = contentType ? [contentType] : Object.keys(body?.content ?? {})

  const content = requestContentTypes.flatMap((ct) => {
    const schema = getBodySchema({ content: body?.content, contentType: ct, refs })
    if (!schema) return []
    return [
      ast.factory.createContent({
        contentType: ct,
        schema: ast.optionality(parseSchema({ schema, name: requestBodyName }), bodyRequired),
        keysToOmit: collectPropertyKeysByFlag(schema, 'readOnly'),
      }),
    ]
  })

  const requestBody =
    content.length > 0 || body?.description
      ? {
          description: body?.description,
          required: bodyRequired || undefined,
          content: content.length > 0 ? content : undefined,
        }
      : undefined

  const responses = getResponseStatusCodes(operation).map((statusCode) => {
    const response = getResponseByStatusCode({ operation, refs, statusCode })
    // `Status<code>` keeps nested enum names clear of a component schema named `<operation><statusCode>`.
    const responseName = operationName ? `${operationName}Status${statusCode}` : undefined

    const parseEntrySchema = (ct?: string) => {
      const raw = getBodySchema({ content: response?.content, contentType: ct, refs })
      const node =
        raw && Object.keys(raw).length > 0 ? parseSchema({ schema: raw, name: responseName }) : ast.factory.createSchema({ type: options.emptySchemaType })
      return { schema: node, keysToOmit: collectPropertyKeysByFlag(raw, 'writeOnly') }
    }

    const responseContentTypes = contentType ? [contentType] : Object.keys(response?.content ?? {})
    const responseContent = responseContentTypes.map((ct) => ast.factory.createContent({ contentType: ct, ...parseEntrySchema(ct) }))

    // A body-less response keeps one fallback entry so it still resolves to a (void/any) schema.
    if (responseContent.length === 0) {
      responseContent.push(
        ast.factory.createContent({
          contentType: getRequestContentType({ operation, refs }) || 'application/json',
          ...parseEntrySchema(contentType),
        }),
      )
    }

    return ast.factory.createResponse({
      statusCode: statusCode as ast.StatusCode,
      description: response?.description,
      content: responseContent,
    })
  })

  const pickDoc = (key: 'summary' | 'description'): string | undefined => {
    const own = operation.schema[key]
    if (typeof own === 'string') return own
    const fallback = (operation.pathItem as Record<string, unknown>)[key]
    return typeof fallback === 'string' ? fallback : undefined
  }

  return ast.factory.createOperation({
    operationId,
    protocol: 'http',
    method: operation.method.toUpperCase() as ast.HttpMethod,
    path: operation.path,
    tags: Array.isArray(operation.schema.tags) ? operation.schema.tags.map(String) : [],
    summary: pickDoc('summary') || undefined,
    description: pickDoc('description') || undefined,
    deprecated: operation.schema.deprecated || undefined,
    parameters,
    requestBody,
    responses,
  })
}
