export type MediaTypeInput = string | { contentType: string }

const jsonMediaTypes = new Set(['application/json', 'text/json'])

/** The media type without its parameters, in lower case: `Text/Plain; charset=utf-8` gives `text/plain`. */
export function getBase(mediaType: MediaTypeInput): string {
  const value = typeof mediaType === 'string' ? mediaType : mediaType.contentType
  return value.split(';')[0]!.trim().toLowerCase()
}

/** Whether the media type is `application/json`, `text/json`, or has a `+json` suffix. */
export function isJson(mediaType: MediaTypeInput): boolean {
  const baseType = getBase(mediaType)
  return jsonMediaTypes.has(baseType) || baseType.endsWith('+json')
}
