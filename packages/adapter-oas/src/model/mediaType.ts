import { SEQUENTIAL_MEDIA_TYPES } from '../constants.ts'
import { isJsonMimeType, isReference } from '../oas.ts'
import type { Refs } from '../refs.ts'
import type { MediaTypeObject, ReferenceObject, SchemaObject } from '../types.ts'

/** The media type without its parameters, so `text/event-stream; charset=utf-8` matches `text/event-stream`. */
function baseMediaType(contentType: string): string {
  return contentType.split(';')[0]!.trim().toLowerCase()
}

/**
 * Whether the media type is read as a sequence of items: one of the OpenAPI 3.2 sequential media
 * types, or any media type that declares `itemSchema`.
 */
export function isSequential(contentType: string, mediaType: MediaTypeObject | null): boolean {
  return SEQUENTIAL_MEDIA_TYPES.has(baseMediaType(contentType)) || mediaType?.itemSchema !== undefined
}

/**
 * Whether the media type is `text/event-stream`.
 */
export function isEventStream(contentType: string): boolean {
  return baseMediaType(contentType) === 'text/event-stream'
}

/**
 * Replaces a `data` string that holds JSON (`contentMediaType` and `contentSchema`) with its
 * `contentSchema`, so the event reads as parsed: `{ event: 'message_delta', data: MessageDelta }`.
 */
function withParsedData(schema: SchemaObject, refs: Refs): SchemaObject {
  const data = schema.properties?.data as SchemaObject | ReferenceObject | undefined
  const resolved = data && isReference(data) ? refs.resolve<SchemaObject>(data.$ref, { report: false }) : data
  if (!resolved?.contentSchema || !resolved.contentMediaType || !isJsonMimeType(resolved.contentMediaType)) return schema

  // `SchemaObject` is a discriminated union, so the spread is asserted rather than annotated.
  const parsed = { ...schema, properties: { ...schema.properties, data: resolved.contentSchema } }
  return parsed as SchemaObject
}

/**
 * Normalizes the OpenAPI 3.2 `text/event-stream` item schema into one schema per event. Shared
 * `properties` next to an inline `oneOf`/`anyOf` are merged into each member, the member's own
 * properties winning, and a JSON `data` string becomes its `contentSchema`. A `$ref` member keeps
 * the schema as written, so the named event type stays a reference.
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

/**
 * Whether a `text/event-stream` item schema describes the parsed event (it declares `event` or
 * `data`, directly or in a composition member) or only the `data` payload the client wraps.
 */
export function getItemShape(schema: SchemaObject | ReferenceObject, refs: Refs): 'event' | 'data' {
  return declaresEventFields(schema, refs, new Set()) ? 'event' : 'data'
}

/**
 * The raw schema of one item of a sequential media type: `itemSchema`, or on `text/event-stream`
 * the `schema`, which 3.0 and 3.1 documents use to describe one event. An event stream schema is
 * normalized with {@link toEventSchema}. `null` for complete (non-sequential) content.
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
