import type { ContentNode } from '../nodes/content.ts'
import type { SchemaNode } from '../nodes/schema.ts'

type MediaTypeInput = string | { contentType: string }

const jsonMediaTypes = new Set(['application/json', 'text/json'])
const streamMediaTypes = new Set(['application/jsonl', 'application/x-ndjson', 'application/json-seq', 'text/event-stream'])

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

/** Whether the media type is a stream of items: SSE, JSON Lines, or a `+json-seq` sequence. */
export function isStream(mediaType: MediaTypeInput): boolean {
  const baseType = getBase(mediaType)
  return streamMediaTypes.has(baseType) || (baseType.startsWith('application/') && baseType.endsWith('+json-seq'))
}

type ContentEntry = { contentType: string; schema?: Pick<SchemaNode, 'type'> | null; stream?: ContentNode['stream'] }

/** How a content entry is framed as a stream: `'events'` for Server-Sent Events, `'lines'` for JSON Lines. */
export function getStreamFraming(entry: Pick<ContentEntry, 'contentType' | 'stream'>): 'events' | 'lines' | undefined {
  if (getBase(entry) === 'text/event-stream') return 'events'
  // `multipart/mixed` with an `itemSchema` also has `stream`, but it is a stream of parts, not of JSON values.
  return entry.stream && isStream(entry) ? 'lines' : undefined
}

const formKinds: Record<string, 'form' | 'urlencoded'> = { 'multipart/form-data': 'form', 'application/x-www-form-urlencoded': 'urlencoded' }

/** How a client reads or sends a content entry, or `null` for another media type. A `blob` schema is `binary`. */
export function getKind(entry: string | ContentEntry): 'json' | 'form' | 'urlencoded' | 'text' | 'binary' | 'eventStream' | 'lineStream' | null {
  const content = typeof entry === 'string' ? { contentType: entry } : entry
  const baseType = getBase(content)
  if (!baseType) return null
  const framing = getStreamFraming(content)
  if (framing) return framing === 'events' ? 'eventStream' : 'lineStream'
  if (isJson(baseType)) return 'json'
  if (formKinds[baseType]) return formKinds[baseType]
  if (content.schema?.type === 'blob') return 'binary'
  if (baseType.startsWith('text/')) return 'text'
  if (baseType === 'application/octet-stream' || baseType === 'application/pdf' || /^(image|audio|video)\//.test(baseType)) return 'binary'
  return null
}
