/**
 * MIME type fragments that mark a media type as JSON-like.
 *
 * A content type is JSON when it contains any of these substrings. The `+json` entry catches
 * structured-syntax suffixes such as `application/vnd.api+json`.
 */
const jsonMimeFragments = ['application/json', 'application/x-json', 'text/json', 'text/x-json', '+json'] as const

/**
 * Returns `true` when a media type string is JSON-like.
 *
 * @example
 * ```ts
 * isJsonMimeType('application/json')         // true
 * isJsonMimeType('application/vnd.api+json') // true
 * isJsonMimeType('multipart/form-data')      // false
 * ```
 */
export function isJsonMimeType(mimeType: string): boolean {
  return jsonMimeFragments.some((fragment) => mimeType.includes(fragment))
}

/**
 * Returns `true` when a media type denotes a raw binary body.
 *
 * OAS 3.1 (and the 3.0 -> 3.1 upgrade) represents an `application/octet-stream` body as an empty
 * media type object, dropping the schema. Generators use this to recognize the body is still binary.
 *
 * @example
 * ```ts
 * isBinaryMimeType('application/octet-stream') // true
 * isBinaryMimeType('application/json')         // false
 * ```
 */
export function isBinaryMimeType(mimeType: string): boolean {
  return mimeType === 'application/octet-stream'
}
