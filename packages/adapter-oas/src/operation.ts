import { SUPPORTED_METHODS } from './constants.ts'
import { isReference } from './guards.ts'
import { isJsonMimeType } from './mime.ts'
import { resolveRef } from './refs.ts'
import type { Document, MediaTypeObject, OperationObject, PathItemObject, ReferenceObject, RequestBodyObject, ResponseObject } from './types.ts'

/**
 * Strips an operation id down to a slug, mirroring the `oas` library's fallback when an operation
 * has no `operationId`. Non-alphanumerics collapse to single dashes with no leading or trailing dash.
 */
function sanitizeOperationId(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

type CreateOperationOptions = {
  document: Document
  path: string
  method: string
  schema: OperationObject
}

/**
 * Wraps a single OpenAPI operation with the accessor methods Kubb relies on.
 *
 * This replaces the `Operation` class from the `oas` package. Each method reads straight from the
 * underlying `schema` object (a live reference into the document, so in-place `$ref` resolution is
 * shared with the resolvers), and the semantics match what `oas` returned for the calls Kubb makes.
 *
 * @example
 * ```ts
 * const [operation] = getOperations(document)
 * operation.getOperationId() // 'listPets'
 * ```
 */
export function createOperation({ document, path, method, schema }: CreateOperationOptions) {
  let contentTypeCache: string | undefined

  function getResolvedRequestBody(): RequestBodyObject | false {
    const requestBody = schema.requestBody as RequestBodyObject | ReferenceObject | undefined
    if (!requestBody) return false
    if (isReference(requestBody)) {
      const resolved = resolveRef<RequestBodyObject>(document, requestBody.$ref)
      ;(schema as { requestBody?: unknown }).requestBody = resolved
      if (!resolved || isReference(resolved)) return false
      return resolved
    }
    return requestBody
  }

  function getResponses(): Record<string, ResponseObject | ReferenceObject> | undefined {
    const responses = schema.responses as Record<string, ResponseObject | ReferenceObject> | undefined
    if (!responses || isReference(responses)) return undefined
    return responses
  }

  /**
   * Returns the operation's `operationId`, falling back to `<method>_<slugified-path>` when absent.
   */
  function getOperationId(): string {
    const { operationId } = schema
    if (typeof operationId === 'string' && operationId.length > 0) {
      return operationId
    }
    return `${method}_${sanitizeOperationId(path).toLowerCase()}`
  }

  /**
   * Returns the operation tags as `{ name }` objects. Only `name` is read downstream.
   */
  function getTags(): Array<{ name: string }> {
    const { tags } = schema
    if (!Array.isArray(tags)) return []
    return tags.map((tag) => ({ name: String(tag) }))
  }

  function getSummary(): string | undefined {
    if (typeof schema.summary === 'string') return schema.summary
    const pathItem = document.paths?.[path]
    if (pathItem && !isReference(pathItem) && typeof pathItem.summary === 'string') return pathItem.summary
    return undefined
  }

  function getDescription(): string | undefined {
    if (typeof schema.description === 'string') return schema.description
    const pathItem = document.paths?.[path]
    if (pathItem && !isReference(pathItem) && typeof pathItem.description === 'string') return pathItem.description
    return undefined
  }

  function isDeprecated(): boolean {
    return Boolean(schema.deprecated)
  }

  function getResponseStatusCodes(): Array<string> {
    const responses = getResponses()
    if (!responses) return []
    return Object.keys(responses).filter((key) => {
      if (key.startsWith('x-')) return false
      const response = responses[key]
      return !!response && typeof response === 'object'
    })
  }

  function getResponseByStatusCode(statusCode: string | number): ResponseObject | false {
    const responses = getResponses()
    if (!responses) return false
    const response = responses[statusCode]
    if (!response) return false
    if (isReference(response)) {
      const resolved = resolveRef<ResponseObject>(document, response.$ref)
      responses[statusCode] = resolved as ResponseObject
      if (!resolved || isReference(resolved)) return false
      return resolved
    }
    return response
  }

  /**
   * Returns the request body media type. With `mediaType` set, returns that entry or `false`.
   * Otherwise picks the first JSON-like media type, then the first declared one, as a
   * `[mediaType, object]` tuple.
   */
  function getRequestBody(mediaType?: string): MediaTypeObject | false | [string, MediaTypeObject] {
    const requestBody = getResolvedRequestBody()
    if (!requestBody || !requestBody.content) return false
    const { content } = requestBody

    if (mediaType) {
      if (!(mediaType in content)) return false
      return content[mediaType]!
    }

    const mediaTypes = Object.keys(content)
    const available = mediaTypes.find((mt) => isJsonMimeType(mt)) ?? mediaTypes[0]
    if (!available) return false
    return [available, content[available]!]
  }

  function getContentType(): string {
    if (contentTypeCache) return contentTypeCache

    const requestBody = getResolvedRequestBody()
    const mediaTypes = requestBody && requestBody.content ? Object.keys(requestBody.content) : []

    let result = mediaTypes[0] ?? 'application/json'
    for (const mt of mediaTypes) {
      if (isJsonMimeType(mt)) result = mt
    }

    contentTypeCache = result
    return result
  }

  return {
    schema,
    path,
    method,
    get contentType(): string {
      return getContentType()
    },
    getOperationId,
    getTags,
    getSummary,
    getDescription,
    isDeprecated,
    getResponseStatusCodes,
    getResponseByStatusCode,
    getRequestBody,
  }
}

/**
 * API operation extracted from an OpenAPI document, replacing the `oas` package's `Operation` class.
 */
export type Operation = ReturnType<typeof createOperation>

/**
 * Builds an `Operation` for every method on every path in the document.
 *
 * Path keys and methods are walked in document order (matching the `oas` library), `x-` keys and
 * path-item `$ref`s are resolved or skipped, and only the eight HTTP methods in `SUPPORTED_METHODS`
 * become operations. Wrappers hold references into the document rather than copies, so repeated
 * calls stay cheap for streaming.
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
  if (!paths) return operations

  for (const path of Object.keys(paths)) {
    if (path.startsWith('x-')) continue

    let pathItem = paths[path] as PathItemObject | ReferenceObject | undefined
    if (!pathItem) continue
    if (isReference(pathItem)) {
      const resolved = resolveRef<PathItemObject>(document, pathItem.$ref)
      ;(paths as Record<string, unknown>)[path] = resolved
      if (!resolved || isReference(resolved)) continue
      pathItem = resolved
    }

    const item = pathItem as Record<string, unknown>
    for (const method of Object.keys(item)) {
      if (!SUPPORTED_METHODS.has(method)) continue
      const schema = item[method]
      if (!schema || typeof schema !== 'object') continue
      operations.push(createOperation({ document, path, method, schema: schema as OperationObject }))
    }
  }

  return operations
}
