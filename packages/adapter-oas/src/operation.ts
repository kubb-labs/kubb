import { SUPPORTED_METHODS } from './constants.ts'
import { isJsonMimeType, isReference } from './oas.ts'
import type { Refs } from './refs.ts'
import type { Document, MediaTypeObject, OperationObject, PathItemObject, ReferenceObject, RequestBodyObject, ResponseObject } from './types.ts'

/**
 * A single OpenAPI operation: its URL path, HTTP method, and the raw operation object.
 *
 * `schema` is a live reference into the document. Unlike earlier versions of this adapter, nothing
 * resolves a `$ref` in place here anymore — every accessor below resolves through `refs` instead.
 */
export type Operation = {
  path: string
  method: string
  schema: OperationObject
}

/**
 * The operation being read plus the `$ref` service to resolve against.
 */
type OperationContext = {
  operation: Operation
  refs: Refs
}

/**
 * Slugifies a path for the `operationId` fallback: non-alphanumerics collapse to single dashes,
 * with no leading or trailing dash.
 */
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
 * Returns the response object for a status code, resolving a `$ref` through `refs`. `false` when absent.
 */
export function getResponseByStatusCode({ operation, refs, statusCode }: OperationContext & { statusCode: string | number }): ResponseObject | false {
  const responses = operation.schema.responses as Record<string, ResponseObject | ReferenceObject> | undefined
  if (!responses || isReference(responses)) {
    return false
  }

  return refs.deref<ResponseObject>(responses[statusCode]) ?? false
}

/**
 * Resolves the request body (a `$ref` through `refs`) and returns its content map, or
 * `undefined` when the operation has no request body.
 */
function getRequestBodyContent({ operation, refs }: OperationContext): Record<string, MediaTypeObject> | undefined {
  const requestBody = refs.deref<RequestBodyObject>(operation.schema.requestBody)

  return requestBody?.content
}

/**
 * Returns the request body media type. With `mediaType` set, returns that entry or `false`.
 * Otherwise picks the first JSON-like media type, then the first declared one, as a
 * `[mediaType, object]` tuple.
 */
export function getRequestContent({ operation, refs, mediaType }: OperationContext & { mediaType?: string }): MediaTypeObject | false | [string, MediaTypeObject] {
  const content = getRequestBodyContent({ operation, refs })

  if (!content) {
    return false
  }

  if (mediaType) {
    return mediaType in content ? content[mediaType]! : false
  }

  const mediaTypes = Object.keys(content)
  const available = mediaTypes.find((mt) => isJsonMimeType(mt)) ?? mediaTypes[0]

  return available ? [available, content[available]!] : false
}

/**
 * Returns the primary request content type. Prefers a JSON-like media type (the last one wins
 * when several are declared), then the first declared one, defaulting to `'application/json'`.
 */
export function getRequestContentType({ operation, refs }: OperationContext): string {
  const content = getRequestBodyContent({ operation, refs })
  const mediaTypes = content ? Object.keys(content) : []

  let result = mediaTypes[0] ?? 'application/json'
  for (const mt of mediaTypes) {
    if (isJsonMimeType(mt)) {
      result = mt
    }
  }

  return result
}

/**
 * Builds an `Operation` for every supported HTTP method on every path, in document order.
 * `x-` path keys and unresolvable path-item `$ref`s are skipped.
 *
 * @example
 * ```ts
 * for (const operation of getOperations(document, refs)) {
 *   parseOperation(options, operation)
 * }
 * ```
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
      operations.push({ path, method, schema: schema as OperationObject })
    }
  }

  return operations
}
