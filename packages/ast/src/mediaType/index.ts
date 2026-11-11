const jsonMediaTypes = new Set(['application/json', 'text/json'])
const streamMediaTypes = new Set(['application/jsonl', 'application/x-ndjson', 'application/json-seq', 'text/event-stream'])
const formMediaTypes = new Set(['multipart/form-data', 'application/x-www-form-urlencoded'])

/** The media type without its parameters, in lower case: `Text/Plain; charset=utf-8` gives `text/plain`. */
export function base(mediaType: string): string {
  return mediaType.split(';')[0]!.trim().toLowerCase()
}

/** Whether the media type is `application/json`, `text/json`, or has a `+json` suffix. */
export function isJson(mediaType: string): boolean {
  const baseType = base(mediaType)
  return jsonMediaTypes.has(baseType) || baseType.endsWith('+json')
}

/** Whether the media type is a stream of items: SSE, JSON Lines, or a `+json-seq` sequence. */
export function isStream(mediaType: string): boolean {
  const baseType = base(mediaType)
  return streamMediaTypes.has(baseType) || (baseType.startsWith('application/') && baseType.endsWith('+json-seq'))
}

/** Whether the media type is `multipart/form-data` or `application/x-www-form-urlencoded`. */
export function isForm(mediaType: string): boolean {
  return formMediaTypes.has(base(mediaType))
}
