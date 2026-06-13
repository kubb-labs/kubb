import { SUPPORTED_METHODS } from './constants.ts'
import { isReference } from './guards.ts'
import { isJsonMimeType } from './mime.ts'
import { resolveRef } from './refs.ts'
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
  const response = responses[statusCode]
  if (!response) {
    return false
  }
  if (isReference(response)) {
    const resolved = resolveRef<ResponseObject>(document, response.$ref)
    responses[statusCode] = resolved as ResponseObject
    if (!resolved || isReference(resolved)) {
      return false
    }
    return resolved
  }
  return response
}

/**
 * Resolves the request body (dereferencing a `$ref` in place) and returns its content map, or
 * `undefined` when the operation has no request body.
 */
function getRequestBodyContent({ document, operation }: OperationContext): Record<string, MediaTypeObject> | undefined {
  const { schema } = operation
  let requestBody = schema.requestBody as RequestBodyObject | ReferenceObject | undefined
  if (!requestBody) {
    return undefined
  }
  if (isReference(requestBody)) {
    const resolved = resolveRef<RequestBodyObject>(document, requestBody.$ref)
    ;(schema as { requestBody?: unknown }).requestBody = resolved
    if (!resolved || isReference(resolved)) {
      return undefined
    }
    requestBody = resolved
  }
  return requestBody.content
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
 * Returns the primary request content type. Prefers a JSON-like media type (the last one wins,
 * matching the previous behavior), then the first declared one, defaulting to `'application/json'`.
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

    let pathItem = paths[path] as PathItemObject | ReferenceObject | undefined
    if (!pathItem) {
      continue
    }
    if (isReference(pathItem)) {
      const resolved = resolveRef<PathItemObject>(document, pathItem.$ref)
      ;(paths as Record<string, unknown>)[path] = resolved
      if (!resolved || isReference(resolved)) {
        continue
      }
      pathItem = resolved
    }

    const item = pathItem as Record<string, unknown>
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
