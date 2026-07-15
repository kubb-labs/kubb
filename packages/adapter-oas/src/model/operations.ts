import { isJsonMimeType, isReference } from '../oas.ts'
import { getRequestContent, getResponseByStatusCode } from '../operation.ts'
import { dereferenceWithRef, derefInPlace } from '../refs.ts'
import type { ContentType, Document, MediaTypeObject, Operation, ParameterObject, ResponseObject, SchemaObject } from '../types.ts'

export type OperationsOptions = {
  contentType?: ContentType
}

/**
 * Returns all parameters for an operation, merging path-level and operation-level entries.
 * Operation-level parameters override path-level ones with the same `in:name` key.
 * Each `$ref` parameter is dereferenced via `dereferenceWithRef` before merging.
 *
 * @example
 * ```ts
 * getParameters(document, operation)
 * // [{ name: 'petId', in: 'path', required: true, schema: { type: 'integer' } }]
 * ```
 */
export function getParameters(document: Document, operation: Operation): Array<ParameterObject> {
  const resolveParams = (params: Array<unknown>): Array<ParameterObject> =>
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

function getResponseBody(responseBody: boolean | ResponseObject, contentType?: string): MediaTypeObject | false {
  if (!responseBody) return false
  if (isReference(responseBody)) return false

  const body = responseBody as ResponseObject
  if (!body.content) return false

  if (contentType) {
    if (!(contentType in body.content)) return false
    return body.content[contentType]!
  }

  const contentTypes = Object.keys(body.content)
  const availableContentType = contentTypes.find(isJsonMimeType) ?? contentTypes[0]
  if (!availableContentType) return false

  return body.content[availableContentType]!
}

// Dereference every response `$ref` in place so callers can read response bodies directly.
function resolveResponseRefs(document: Document, operation: Operation): void {
  const responses = operation.schema.responses as Record<string, unknown> | undefined
  if (!responses) return
  for (const key in responses) {
    derefInPlace({ document, container: responses, key })
  }
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
  resolveResponseRefs(document, operation)

  const responseBody = getResponseBody(getResponseByStatusCode({ document, operation, statusCode }), options.contentType)

  if (responseBody === false) {
    return {}
  }

  const schema = responseBody.schema

  if (!schema) {
    return {}
  }

  return dereferenceWithRef(document, schema)
}

/**
 * Returns the request body schema for an operation, or `null` when absent.
 *
 * @example
 * ```ts
 * getRequestSchema(document, operation) // SchemaObject | null
 * ```
 */
export function getRequestSchema(document: Document, operation: Operation, options: OperationsOptions = {}): SchemaObject | null {
  if (operation.schema.requestBody) {
    operation.schema.requestBody = dereferenceWithRef(document, operation.schema.requestBody)
  }

  const requestBody = getRequestContent({ document, operation, mediaType: options.contentType })

  if (requestBody === false) {
    return null
  }

  const mediaType = Array.isArray(requestBody) ? requestBody[0] : options.contentType
  const schema = Array.isArray(requestBody) ? requestBody[1].schema : requestBody.schema

  // OAS 3.1 (and the 3.0 -> 3.1 upgrade) drops the schema for an `application/octet-stream` body,
  // leaving an empty media type object. Synthesize the binary schema so generators still emit a
  // request body type for the operation.
  if (mediaType === 'application/octet-stream' && (!schema || Object.keys(schema).length === 0)) {
    return { type: 'string', contentMediaType: 'application/octet-stream' }
  }

  if (!schema) {
    return null
  }

  return dereferenceWithRef(document, schema)
}

/**
 * Returns all request body content type keys for an operation.
 *
 * The requestBody is dereferenced in place when it is a `$ref` (the same mutation that
 * `getRequestSchema` already performs), so the returned list accurately reflects the
 * available content types even for referenced bodies.
 *
 * @example
 * ```ts
 * getRequestBodyContentTypes(document, operation)
 * // ['application/json', 'multipart/form-data']
 * ```
 */
export function getRequestBodyContentTypes(document: Document, operation: Operation): Array<string> {
  if (operation.schema.requestBody) {
    operation.schema.requestBody = dereferenceWithRef(document, operation.schema.requestBody)
  }

  const body = operation.schema.requestBody as { content?: Record<string, unknown> } | undefined
  if (!body) return []

  // dereferenceWithRef keeps $ref but spreads all resolved fields (including `content`).
  // Do not bail out on isReference, the content is already present on the merged object.
  return body.content ? Object.keys(body.content) : []
}

/**
 * Returns all response content type keys for an operation at a given status code.
 *
 * Response `$ref`s are resolved in place first (the same mutation `getResponseSchema` performs),
 * so the returned list reflects the available content types even for referenced responses.
 *
 * @example
 * ```ts
 * getResponseBodyContentTypes(document, operation, 200)
 * // ['application/json', 'application/xml']
 * ```
 */
export function getResponseBodyContentTypes(document: Document, operation: Operation, statusCode: string | number): Array<string> {
  resolveResponseRefs(document, operation)

  const responseObj = getResponseByStatusCode({ document, operation, statusCode })
  if (!responseObj || typeof responseObj !== 'object' || isReference(responseObj)) return []

  const body = responseObj as { content?: Record<string, unknown> }
  return body.content ? Object.keys(body.content) : []
}
