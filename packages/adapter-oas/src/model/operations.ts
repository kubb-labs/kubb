import { isReference, pickContentEntry } from '../oas.ts'
import { getRequestBody, getRequestContent, getResponseByStatusCode } from '../operation.ts'
import { dereferenceWithRef } from '../refs.ts'
import type { Refs } from '../refs.ts'
import type { ContentTypeOptions, Document, MediaTypeObject, Operation, ParameterObject, ResponseObject, SchemaObject } from '../types.ts'

export type OperationsOptions = ContentTypeOptions

/**
 * Returns all parameters for an operation, merging path-level and operation-level entries.
 * Operation-level parameters override path-level ones with the same `in:name` key.
 * Each `$ref` parameter is dereferenced via `dereferenceWithRef` before merging.
 *
 * @example
 * ```ts
 * getParameters({ document, operation })
 * // [{ name: 'petId', in: 'path', required: true, schema: { type: 'integer' } }]
 * ```
 */
export function getParameters({ document, operation }: { document: Document; operation: Operation }): Array<ParameterObject> {
  const resolveParams = (params: Array<unknown>): Array<ParameterObject> =>
    params.map((p) => dereferenceWithRef(document, p)).filter((p): p is ParameterObject => !!p && typeof p === 'object' && 'in' in p && 'name' in p)

  const operationParams = resolveParams(operation.schema?.parameters || [])
  const pathLevelParams = resolveParams((operation.pathItem as { parameters?: Array<unknown> }).parameters ?? [])

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
    return contentType in body.content ? body.content[contentType]! : false
  }

  const picked = pickContentEntry(body.content)
  return picked ? picked[1] : false
}

/**
 * Returns the response schema for a given operation and HTTP status code.
 *
 * Returns an empty object `{}` when no response body schema is available.
 *
 * @example
 * ```ts
 * getResponseSchema({ document, operation, refs, statusCode: 200 })   // SchemaObject
 * getResponseSchema({ document, operation, refs, statusCode: '4XX' }) // {}
 * ```
 */
export function getResponseSchema({
  document,
  operation,
  refs,
  statusCode,
  options = {},
}: {
  document: Document
  operation: Operation
  refs: Refs
  statusCode: string | number
  options?: OperationsOptions
}): SchemaObject {
  const responseBody = getResponseBody(getResponseByStatusCode({ operation, refs, statusCode }), options.contentType)

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
 * getRequestSchema({ document, operation, refs }) // SchemaObject | null
 * ```
 */
export function getRequestSchema({
  document,
  operation,
  refs,
  options = {},
}: {
  document: Document
  operation: Operation
  refs: Refs
  options?: OperationsOptions
}): SchemaObject | null {
  const requestBody = getRequestContent({ operation, refs, mediaType: options.contentType })

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
 * Returns all request body content type keys for an operation, resolving a `$ref` requestBody
 * through `refs`.
 *
 * @example
 * ```ts
 * getRequestBodyContentTypes(operation, refs)
 * // ['application/json', 'multipart/form-data']
 * ```
 */
export function getRequestBodyContentTypes(operation: Operation, refs: Refs): Array<string> {
  const body = getRequestBody({ operation, refs })

  return body?.content ? Object.keys(body.content) : []
}

/**
 * Returns all response content type keys for an operation at a given status code, resolving the
 * response `$ref` through `refs`.
 *
 * @example
 * ```ts
 * getResponseBodyContentTypes(operation, refs, 200)
 * // ['application/json', 'application/xml']
 * ```
 */
export function getResponseBodyContentTypes(operation: Operation, refs: Refs, statusCode: string | number): Array<string> {
  const responseObj = getResponseByStatusCode({ operation, refs, statusCode })
  if (!responseObj || typeof responseObj !== 'object' || isReference(responseObj)) return []

  const body = responseObj as { content?: Record<string, unknown> }
  return body.content ? Object.keys(body.content) : []
}
