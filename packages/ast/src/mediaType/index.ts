type MediaTypeInput = string | { contentType: string }

const jsonMediaTypes = new Set(['application/json', 'text/json'])
const streamMediaTypes = new Set(['application/jsonl', 'application/x-ndjson', 'application/json-seq', 'text/event-stream'])

/** The media type without its parameters, in lower case: `Text/Plain; charset=utf-8` gives `text/plain`. */
export function base(mediaType: MediaTypeInput): string {
  const value = typeof mediaType === 'string' ? mediaType : mediaType.contentType
  return value.split(';')[0]!.trim().toLowerCase()
}

/** Whether the media type is `application/json`, `text/json`, or has a `+json` suffix. */
export function isJson(mediaType: MediaTypeInput): boolean {
  const baseType = base(mediaType)
  return jsonMediaTypes.has(baseType) || baseType.endsWith('+json')
}

/** Whether the media type is a stream of items: SSE, JSON Lines, or a `+json-seq` sequence. */
export function isStream(mediaType: MediaTypeInput): boolean {
  const baseType = base(mediaType)
  return streamMediaTypes.has(baseType) || (baseType.startsWith('application/') && baseType.endsWith('+json-seq'))
}
