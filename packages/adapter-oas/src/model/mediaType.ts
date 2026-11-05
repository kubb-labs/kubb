import { SEQUENTIAL_MEDIA_TYPES } from '../constants.ts'
import { isJsonMimeType, isReference } from '../oas.ts'
import type { Refs } from '../refs.ts'
import type { MediaTypeObject, ReferenceObject, SchemaObject } from '../types.ts'

/** The media type without its parameters, so `text/event-stream; charset=utf-8` matches `text/event-stream`. */
function baseMediaType(contentType: string): string {
  return contentType.split(';')[0]!.trim().toLowerCase()
}

/** Whether the media type is a sequence of items: an OpenAPI 3.2 sequential media type, or one that declares `itemSchema`. */
export function isSequential(contentType: string, mediaType: MediaTypeObject | null): boolean {
  return SEQUENTIAL_MEDIA_TYPES.has(baseMediaType(contentType)) || mediaType?.itemSchema !== undefined
}

/** Whether the media type is `text/event-stream`. */
export function isEventStream(contentType: string): boolean {
  return baseMediaType(contentType) === 'text/event-stream'
}

/** Replaces a `data` string that holds JSON with its `contentSchema`, so the event reads as parsed. */
function withParsedData(schema: SchemaObject, refs: Refs): SchemaObject {
  const data = schema.properties?.data as SchemaObject | ReferenceObject | undefined
  const resolved = data && isReference(data) ? refs.resolve<SchemaObject>(data.$ref, { report: false }) : data
  if (!resolved?.contentSchema || !resolved.contentMediaType || !isJsonMimeType(resolved.contentMediaType)) return schema

  const parsed = { ...schema, properties: { ...schema.properties, data: resolved.contentSchema } }
  return parsed as SchemaObject
}

/**
 * Normalizes the OpenAPI 3.2 `text/event-stream` item schema into one schema per event: shared `properties`
 * merge into each inline `oneOf`/`anyOf` member (the member wins) and a JSON `data` string becomes its
 * `contentSchema`. A `$ref` member keeps the schema as written, so the named event type stays a reference.
 */
export function toEventSchema(schema: SchemaObject | ReferenceObject, refs: Refs): SchemaObject | ReferenceObject {
  if (isReference(schema)) return schema
  const key = schema.oneOf?.length ? 'oneOf' : schema.anyOf?.length ? 'anyOf' : undefined
  if (!key) return withParsedData(schema, refs)

  const members = schema[key] as Array<SchemaObject | ReferenceObject>
  if (members.some(isReference)) return schema

  const { properties, required, ...rest } = schema as SchemaObject & { properties?: Record<string, unknown>; required?: Array<string> }
  const mergeShared = (member: SchemaObject): SchemaObject => {
    if (!properties) return member
    const memberRequired = [...new Set([...(required ?? []), ...((member.required as Array<string> | undefined) ?? [])])]
    const merged = {
      type: 'object',
      ...member,
      properties: { ...properties, ...member.properties },
      ...(memberRequired.length ? { required: memberRequired } : {}),
    }
    return merged as SchemaObject
  }

  const event = { ...(properties ? rest : schema), [key]: members.map((member) => withParsedData(mergeShared(member as SchemaObject), refs)) }
  return event as SchemaObject
}

function declaresEventFields(schema: SchemaObject | ReferenceObject, refs: Refs, seen: Set<string>): boolean {
  let resolved: SchemaObject | null = schema as SchemaObject
  if (isReference(schema)) {
    if (seen.has(schema.$ref)) return false
    seen.add(schema.$ref)
    resolved = refs.resolve<SchemaObject>(schema.$ref, { report: false })
  }
  if (!resolved) return false
  if (resolved.properties && (Object.hasOwn(resolved.properties, 'event') || Object.hasOwn(resolved.properties, 'data'))) return true

  const members = [...(resolved.oneOf ?? []), ...(resolved.anyOf ?? []), ...(resolved.allOf ?? [])] as Array<SchemaObject | ReferenceObject>
  return members.some((member) => declaresEventFields(member, refs, seen))
}

/** Whether an event stream item declares `event` or `data`, directly or in a composition member, or is only the `data` payload. */
export function getItemShape(schema: SchemaObject | ReferenceObject, refs: Refs): 'event' | 'data' {
  return declaresEventFields(schema, refs, new Set()) ? 'event' : 'data'
}

/**
 * The raw schema of one item of a sequential media type: `itemSchema`, or `schema` on `text/event-stream`,
 * which 3.0 and 3.1 documents use for one event. `null` for complete content.
 */
export function getItemSchema({
  contentType,
  mediaType,
  refs,
}: {
  contentType: string
  mediaType: MediaTypeObject | null
  refs: Refs
}): SchemaObject | ReferenceObject | null {
  if (!mediaType || !isSequential(contentType, mediaType)) return null
  const raw = mediaType.itemSchema ?? (isEventStream(contentType) ? mediaType.schema : undefined)
  if (!raw) return null

  return isEventStream(contentType) ? toEventSchema(raw as SchemaObject | ReferenceObject, refs) : (raw as SchemaObject | ReferenceObject)
}
