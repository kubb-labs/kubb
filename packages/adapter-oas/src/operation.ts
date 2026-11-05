import { escapePointerToken, pascalCase } from '@internals/utils'
import { ast } from '@kubb/kit'
import { SUPPORTED_METHODS } from './constants.ts'
import type { ParseFn } from './emit/parseSchema.ts'
import { getItemSchema, getItemShape, isEventStream, isStream } from './model/mediaType.ts'
import { getBinaryFallbackSchema, isJsonMimeType, isReference, pickExtensions } from './oas.ts'
import { scanSchema } from './schemaDiagnostics.ts'
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
  document: Document
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
 * Returns the operation's JSON pointer, under `additionalOperations` for an OpenAPI 3.2 method outside the fixed fields.
 */
export function getOperationPointer({ path, method }: Pick<Operation, 'path' | 'method'>): string {
  const pathPointer = `#/paths/${escapePointerToken(path)}`

  return SUPPORTED_METHODS.has(method.toLowerCase())
    ? `${pathPointer}/${method.toLowerCase()}`
    : `${pathPointer}/additionalOperations/${escapePointerToken(method)}`
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
export function getParameters({ operation, refs }: OperationContext): Array<{ param: ParameterObject; pointer: string }> {
  // Each parameter keeps the pointer of the entry that declares it, on the path item or the operation.
  const resolveParams = (params: Array<unknown>, pointer: string) =>
    params.flatMap((entry, index) => {
      const param = refs.derefKeepingRef(entry)
      return param && typeof param === 'object' && 'in' in param && 'name' in param
        ? [{ param: param as ParameterObject, pointer: `${pointer}/parameters/${index}` }]
        : []
    })

  const pathPointer = `#/paths/${escapePointerToken(operation.path)}`
  const operationParams = resolveParams(operation.schema?.parameters || [], getOperationPointer(operation))
  const pathLevelParams = resolveParams((operation.pathItem as { parameters?: Array<unknown> }).parameters ?? [], pathPointer)

  const paramMap = new Map<string, { param: ParameterObject; pointer: string }>()
  for (const entry of [...pathLevelParams, ...operationParams]) {
    if (entry.param.name && entry.param.in) {
      paramMap.set(`${entry.param.in}:${entry.param.name}`, entry)
    }
  }

  return Array.from(paramMap.values())
}

const PARAMETER_STYLES = new Set(['matrix', 'label', 'form', 'simple', 'spaceDelimited', 'pipeDelimited', 'deepObject'])

function pickStyleFields({ style, explode, allowReserved }: { style?: string; explode?: boolean; allowReserved?: boolean }): {
  style?: ast.ParameterStyle
  explode?: boolean
  allowReserved?: boolean
} {
  return {
    ...(style !== undefined && PARAMETER_STYLES.has(style) ? { style: style as ast.ParameterStyle } : {}),
    ...(explode !== undefined ? { explode } : {}),
    ...(allowReserved !== undefined ? { allowReserved } : {}),
  }
}

/** The `encoding` of a media type, reduced to the entries that set a field Kubb carries. A `style` outside the OpenAPI set is dropped. */
function getEncoding(encoding: MediaTypeObject['encoding']): Record<string, ast.EncodingNode> | undefined {
  const entries = Object.entries(encoding ?? {}).flatMap(([property, { contentType, ...rest }]) => {
    const node: ast.EncodingNode = { ...(contentType !== undefined ? { contentType } : {}), ...pickStyleFields(rest) }
    return Object.keys(node).length ? [[property, node] as const] : []
  })

  return entries.length ? Object.fromEntries(entries) : undefined
}

type ContentMap = Record<string, MediaTypeObject | ReferenceObject> | undefined

/**
 * Returns the media type entry for `contentType`, resolving a `$ref` into `components.mediaTypes`. `null` when absent.
 */
export function getMediaType({ content, contentType, refs }: { content: ContentMap; contentType: string | undefined; refs: Refs }): MediaTypeObject | null {
  return contentType ? refs.deref<MediaTypeObject>(content?.[contentType]) : null
}

/**
 * Returns the schema for one media type of a `content` map, with the binary fallback for an emptied non-JSON
 * entry. For a stream this is the item schema, so `schema: string` next to `itemSchema` types one item.
 */
export function getBodySchema({
  content,
  contentType,
  refs,
  document,
}: {
  content: ContentMap
  contentType: string | undefined
  refs: Refs
  document: Document
}): SchemaObject | null {
  const entry = getMediaType({ content, contentType, refs })
  if (!contentType || !entry) return null

  const schema = getItemSchema({ contentType, mediaType: entry, refs, document }) ?? entry.schema
  // A declared `itemSchema`, even an empty one, is a schema of its own and not an emptied binary entry.
  const binary = entry.itemSchema ? undefined : getBinaryFallbackSchema(contentType, schema)
  if (binary) return binary

  return schema ? refs.derefKeepingRef(schema as SchemaObject) : null
}

/** The `stream` field of a content node, set when the media type is a stream. `node` is the parsed item schema. */
function getStreamField({
  contentType,
  mediaType,
  refs,
  document,
  node,
}: {
  contentType: string
  mediaType: MediaTypeObject | null
  refs: Refs
  document: Document
  node: ast.SchemaNode
}): Pick<ast.ContentNode, 'stream'> {
  if (!isStream(contentType, mediaType)) return {}
  const raw = getItemSchema({ contentType, mediaType, refs, document })

  return {
    stream: {
      ...(raw ? { schema: node } : {}),
      ...(raw && isEventStream(contentType) ? { shape: getItemShape(raw, refs) } : {}),
    },
  }
}

/** The media type keyword the body schema was read from, for the diagnostic pointer. */
function schemaKeyword(mediaType: MediaTypeObject | null): 'itemSchema' | 'schema' {
  return mediaType?.itemSchema ? 'itemSchema' : 'schema'
}

/** Pointer of a media type entry, following a `$ref` into `components.mediaTypes` so a diagnostic lands on the source. */
function mediaTypePointer(content: ContentMap, contentType: string, fallback: string): string {
  const entry = content?.[contentType]
  return isReference(entry) ? entry.$ref : fallback
}

/**
 * Builds an `Operation` for every supported HTTP method and every OpenAPI 3.2 `additionalOperations` entry on
 * every path, in document order. `x-` path keys and unresolvable path-item `$ref`s are skipped.
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
    for (const [method, schema] of Object.entries(pathItem.additionalOperations ?? {})) {
      // The spec forbids a fixed method here; such an entry would also take the fixed operation's pointer.
      if (schema && typeof schema === 'object' && !SUPPORTED_METHODS.has(method.toLowerCase())) {
        operations.push({ path, method, schema, pathItem })
      }
    }
  }

  return operations
}

/** Property names whose schema has a truthy `readOnly` or `writeOnly` flag; `$ref` entries are skipped. */
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

/** Converts one parameter into a `ParameterNode`, naming an inline schema after the operation and the parameter. */
function parseParameter({
  param,
  pointer,
  parentName,
  options,
  parseSchema,
  refs,
}: Pick<OperationParseContext, 'options' | 'parseSchema' | 'refs'> & { param: ParameterObject; pointer: string; parentName?: string }): ast.ParameterNode {
  const schemaName = parentName && param.name ? pascalCase(`${parentName} ${param.name}`) : undefined
  // A parameter defines either `schema` or `content`, and `content` holds exactly one media type.
  const contentType = param.schema ? undefined : Object.keys(param.content ?? {})[0]
  const rawSchema = param.schema ?? getMediaType({ content: param.content, contentType, refs })?.schema
  const schema: ast.SchemaNode = rawSchema
    ? parseSchema({ schema: rawSchema as SchemaObject, name: schemaName })
    : ast.factory.createSchema({ type: options.unknownType })
  if (rawSchema) scanSchema(schema, contentType ? `${pointer}/content/${escapePointerToken(contentType)}/schema` : `${pointer}/schema`)
  return ast.factory.createParameter({
    pointer,
    name: param.name,
    in: param.in,
    schema: {
      ...schema,
      description: param.description ?? schema.description,
    },
    required: param.required ?? false,
    ...pickStyleFields(param),
    ...(contentType !== undefined ? { contentType } : {}),
  })
}

/**
 * Converts an OAS `Operation` into an `OperationNode`.
 */
export function parseOperation({ operation, ...ctx }: OperationParseContext & { operation: Operation }): ast.OperationNode {
  const { document, refs, contentType, options, parseSchema } = ctx
  const operationId = getOperationId(operation)
  const operationName = operationId ? pascalCase(operationId) : undefined
  const pointer = getOperationPointer(operation)
  const parameters = getParameters({ operation, refs }).map((entry) => parseParameter({ options, parseSchema, refs, ...entry, parentName: operationName }))

  // A configured contentType restricts the body to that one media type; otherwise every declared one is kept.
  const body = getRequestBody({ operation, refs })
  const bodyRequired = body?.required === true
  const requestBodyName = operationName ? `${operationName}Request` : undefined
  const requestContentTypes = contentType ? [contentType] : Object.keys(body?.content ?? {})

  const content = requestContentTypes.flatMap((ct) => {
    const schema = getBodySchema({ content: body?.content, contentType: ct, refs, document })
    if (!schema) return []
    const mediaType = getMediaType({ content: body?.content, contentType: ct, refs })
    const node = ast.optionality(parseSchema({ schema, name: requestBodyName }), bodyRequired)
    scanSchema(node, `${mediaTypePointer(body?.content, ct, `${pointer}/requestBody/content/${escapePointerToken(ct)}`)}/${schemaKeyword(mediaType)}`)
    const encoding = getEncoding(mediaType?.encoding)
    return [
      ast.factory.createContent({
        contentType: ct,
        schema: node,
        keysToOmit: collectPropertyKeysByFlag(schema, 'readOnly'),
        ...(encoding && { encoding }),
        ...getStreamField({ contentType: ct, mediaType, refs, document, node }),
      }),
    ]
  })

  const requestBody =
    content.length > 0 || body?.description
      ? {
          pointer: `${pointer}/requestBody`,
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
      const raw = getBodySchema({ content: response?.content, contentType: ct, refs, document })
      const mediaType = getMediaType({ content: response?.content, contentType: ct, refs })
      const node =
        raw && Object.keys(raw).length > 0 ? parseSchema({ schema: raw, name: responseName }) : ast.factory.createSchema({ type: options.emptySchemaType })
      if (raw && ct) {
        const base = mediaTypePointer(response?.content, ct, `${pointer}/responses/${statusCode}/content/${escapePointerToken(ct)}`)
        scanSchema(node, `${base}/${schemaKeyword(mediaType)}`)
      }
      return {
        schema: node,
        keysToOmit: collectPropertyKeysByFlag(raw, 'writeOnly'),
        ...(ct ? getStreamField({ contentType: ct, mediaType, refs, document, node }) : {}),
      }
    }

    const responseContentTypes = contentType ? [contentType] : Object.keys(response?.content ?? {})
    const responseContent = responseContentTypes.map((ct) => ast.factory.createContent({ contentType: ct, ...parseEntrySchema(ct) }))

    // A body-less response keeps one fallback entry so it still resolves to a (void/any) schema.
    if (responseContent.length === 0) {
      responseContent.push(
        ast.factory.createContent({
          contentType: getRequestContentType({ operation, refs }),
          ...parseEntrySchema(contentType),
        }),
      )
    }

    return ast.factory.createResponse({
      pointer: `${pointer}/responses/${statusCode}`,
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
    pointer,
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
    extensions: pickExtensions(operation.schema),
  })
}
