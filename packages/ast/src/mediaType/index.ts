const jsonMediaTypes = new Set(['application/json', 'text/json'])
const streamMediaTypes = new Set(['application/jsonl', 'application/x-ndjson', 'application/json-seq', 'text/event-stream', 'multipart/mixed'])
const formMediaTypes = new Set(['multipart/form-data', 'application/x-www-form-urlencoded'])

/**
 * The media type without its parameters, in lower case.
 *
 * @example
 * ```ts
 * ast.mediaType.base('Text/Plain; charset=utf-8') // 'text/plain'
 * ```
 */
export function base(mediaType: string): string {
  return mediaType.split(';')[0]!.trim().toLowerCase()
}

/**
 * Whether the media type holds one JSON document: `application/json`, `text/json`, or any `+json` suffix.
 *
 * @example
 * ```ts
 * ast.mediaType.isJson('application/problem+json') // true
 * ```
 */
export function isJson(mediaType: string): boolean {
  const baseType = base(mediaType)
  return jsonMediaTypes.has(baseType) || baseType.endsWith('+json')
}

/**
 * Whether the media type is read as a sequence of items: server-sent events, JSON Lines, JSON text sequences
 * (any `+json-seq` suffix included), or `multipart/mixed` parts.
 *
 * @example
 * ```ts
 * ast.mediaType.isStream('text/event-stream') // true
 * ast.mediaType.isStream('application/geo+json-seq') // true
 * ```
 */
export function isStream(mediaType: string): boolean {
  const baseType = base(mediaType)
  return streamMediaTypes.has(baseType) || (baseType.startsWith('application/') && baseType.endsWith('+json-seq'))
}

/**
 * Whether the media type is a form encoding: `multipart/form-data` or `application/x-www-form-urlencoded`.
 *
 * @example
 * ```ts
 * ast.mediaType.isForm('multipart/form-data; boundary=x') // true
 * ```
 */
export function isForm(mediaType: string): boolean {
  return formMediaTypes.has(base(mediaType))
}
