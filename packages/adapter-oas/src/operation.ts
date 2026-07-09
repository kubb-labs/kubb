import { SUPPORTED_METHODS } from './constants.ts'
import { isJsonMimeType, isReference } from './oas.ts'
import { derefInPlace } from './refs.ts'
import type { Document, MediaTypeObject, OperationObject, PathItemObject, ReferenceObject, RequestBodyObject, ResponseObject } from './types.ts'

/**
 * A single OpenAPI operation: its URL path, HTTP method, and the raw operation object.
 *
 * `schema` is a live reference into the document, so any in-place `$ref` resolution the resolvers
 * perform is visible here too.
 */
export type Operation = {
  path: string
  method: string
  schema: OperationObject
}

/**
 * The document plus the operation being read. Shared by the request/response accessors so they can
 * resolve `$ref`s against the document.
 */
type OperationContext = {
  document: Document
  operation: Operation
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
 * Returns the response object for a status code, resolving a `$ref` in place. `false` when absent.
 */
export function getResponseByStatusCode({ document, operation, statusCode }: OperationContext & { statusCode: string | number }): ResponseObject | false {
  const responses = operation.schema.responses as Record<string, ResponseObject | ReferenceObject> | undefined
  if (!responses || isReference(responses)) {
    return false
  }
  return derefInPlace<ResponseObject>({ document, container: responses, key: statusCode }) ?? false
}

/**
 * Resolves the request body (dereferencing a `$ref` in place) and returns its content map, or
 * `undefined` when the operation has no request body.
 */
function getRequestBodyContent({ document, operation }: OperationContext): Record<string, MediaTypeObject> | undefined {
  const requestBody = derefInPlace<RequestBodyObject>({ document, container: operation.schema as unknown as Record<string, unknown>, key: 'requestBody' })
  return requestBody?.content
}

/**
 * Returns the request body media type. With `mediaType` set, returns that entry or `false`.
 * Otherwise picks the first JSON-like media type, then the first declared one, as a
 * `[mediaType, object]` tuple.
 */
export function getRequestContent({
  document,
  operation,
  mediaType,
}: OperationContext & { mediaType?: string }): MediaTypeObject | false | [string, MediaTypeObject] {
  const content = getRequestBodyContent({ document, operation })
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
export function getRequestContentType({ document, operation }: OperationContext): string {
  const content = getRequestBodyContent({ document, operation })
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
 * for (const operation of getOperations(document)) {
 *   parseOperation(options, operation)
 * }
 * ```
 */
export function getOperations(document: Document): Array<Operation> {
  const operations: Array<Operation> = []
  const paths = document.paths
  if (!paths) {
    return operations
  }

  for (const path of Object.keys(paths)) {
    if (path.startsWith('x-')) {
      continue
    }

    const pathItem = derefInPlace<PathItemObject>({ document, container: paths as Record<string, unknown>, key: path })
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
