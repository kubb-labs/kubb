import { STREAM_MEDIA_TYPES } from '../constants.ts'
import { isJsonMimeType, isOpenApi32, isReference } from '../oas.ts'
import type { Refs } from '../refs.ts'
import type { Document, MediaTypeObject, ReferenceObject, SchemaObject } from '../types.ts'

/**
 * The media type without its parameters, so `text/event-stream; charset=utf-8` matches the bare name.
 */
function baseMediaType(contentType: string): string {
  return contentType.split(';')[0]!.trim().toLowerCase()
}

/**
 * Returns `true` for a media type read as a stream of items: one that OpenAPI 3.2 lists, or any that declares `itemSchema`.
 */
export function isStream(contentType: string, mediaType: MediaTypeObject | null): boolean {
  return STREAM_MEDIA_TYPES.has(baseMediaType(contentType)) || mediaType?.itemSchema !== undefined
}

/**
 * Whether the media type is `text/event-stream`, with or without parameters.
 */
export function isEventStream(contentType: string): boolean {
  return baseMediaType(contentType) === 'text/event-stream'
}

/**
 * Replaces a `data` string that holds JSON with its `contentSchema`, so the event reads as parsed.
 */
function withParsedData(schema: SchemaObject, refs: Refs): SchemaObject {
  const data = schema.properties?.data as SchemaObject | ReferenceObject | undefined
  const resolved = data && isReference(data) ? refs.resolve<SchemaObject>(data.$ref, { report: false }) : data
  if (!resolved?.contentSchema || !resolved.contentMediaType || !isJsonMimeType(resolved.contentMediaType)) return schema

  const parsed = { ...schema, properties: { ...schema.properties, data: resolved.contentSchema } }
  return parsed as SchemaObject
}

/**
 * Inlines a `$ref` event whose JSON `data` string needs its `contentSchema`, so the shared component keeps `data` as a string elsewhere.
 */
function withParsedRef(schema: ReferenceObject, refs: Refs): SchemaObject | ReferenceObject {
  const resolved = refs.resolve<SchemaObject | ReferenceObject>(schema.$ref, { report: false })
  if (!resolved || isReference(resolved)) return schema
  const parsed = withParsedData(resolved, refs)
  return parsed === resolved ? schema : parsed
}

/**
 * Keywords next to `$ref` that only annotate it, so a reference that carries nothing else stays a reference.
 */
const REF_ANNOTATIONS = new Set(['$ref', 'summary', 'description', '$comment'])

/**
 * Applies `extra` on top of `base` the way JSON Schema does: `properties` and `required` add up, other keywords of `extra` win.
 */
function mergeSchemas(base: Pick<SchemaObject, 'properties' | 'required'>, extra: SchemaObject): SchemaObject {
  const required = [...new Set([...(Array.isArray(base.required) ? base.required : []), ...(Array.isArray(extra.required) ? extra.required : [])])]
  const merged = { type: 'object', ...base, ...extra, properties: { ...base.properties, ...extra.properties }, ...(required.length ? { required } : {}) }
  return merged as SchemaObject
}

/**
 * Normalizes the OpenAPI 3.2 `text/event-stream` item schema into one schema per event.
 * - Keywords next to a `$ref` apply to the referenced schema.
 * - Shared `properties` merge into each inline `oneOf`/`anyOf` member.
 * - A JSON `data` string becomes its `contentSchema`.
 */
export function toEventSchema(schema: SchemaObject | ReferenceObject, refs: Refs): SchemaObject | ReferenceObject {
  if (isReference(schema)) {
    const siblings = Object.fromEntries(Object.entries(schema).filter(([key]) => !REF_ANNOTATIONS.has(key)))
    const resolved = Object.keys(siblings).length ? refs.resolve<SchemaObject>(schema.$ref, { report: false }) : null
    return resolved ? toEventSchema(mergeSchemas(resolved, siblings as SchemaObject), refs) : withParsedRef(schema, refs)
  }
  const key = schema.oneOf?.length ? 'oneOf' : schema.anyOf?.length ? 'anyOf' : undefined
  if (!key) return withParsedData(schema, refs)

  const members = schema[key] as Array<SchemaObject | ReferenceObject>
  const { properties, required, ...rest } = schema
  // Shared properties cannot move into a `$ref` member, so they only merge when every member is inline.
  const merge = !!properties && !members.some(isReference)
  const shared = { properties, required }
  const event = {
    ...(merge ? rest : schema),
    [key]: members.map((member) => (isReference(member) ? withParsedRef(member, refs) : withParsedData(merge ? mergeSchemas(shared, member) : member, refs))),
  }
  return event as SchemaObject
}

const SSE_FIELDS: ReadonlySet<string> = new Set(['event', 'id', 'retry', 'data'])

/**
 * Whether the schema, following `$ref`s, or a composition member of it is a whole Server-Sent Event: it declares `data`,
 * or `event` with no field an event cannot carry. An `event` next to fields such as `planet` is the payload's own
 * property, sent as JSON in the `data:` line.
 */
function declaresEventFields(schema: SchemaObject | ReferenceObject, refs: Refs, seen: Set<string>): boolean {
  if (isReference(schema)) {
    if (seen.has(schema.$ref)) return false
    seen.add(schema.$ref)
    const resolved = refs.resolve<SchemaObject | ReferenceObject>(schema.$ref, { report: false })
    return !!resolved && declaresEventFields(resolved, refs, seen)
  }
  const fields = Object.keys(schema.properties ?? {})
  if (fields.includes('data')) return true
  if (fields.includes('event')) return fields.every((field) => SSE_FIELDS.has(field))

  const members = [...(schema.oneOf ?? []), ...(schema.anyOf ?? []), ...(schema.allOf ?? [])] as Array<SchemaObject | ReferenceObject>
  return members.some((member) => declaresEventFields(member, refs, seen))
}

/**
 * Returns `'event'` when the item is a whole event, directly or in a composition member (see `declaresEventFields`), else `'data'`.
 */
export function getItemShape(schema: SchemaObject | ReferenceObject, refs: Refs): 'event' | 'data' {
  return declaresEventFields(schema, refs, new Set()) ? 'event' : 'data'
}

/**
 * Returns the raw item schema: `itemSchema`, or `schema` on `text/event-stream` as 3.0 and 3.1 documents write one event.
 */
export function getItemSchema({
  contentType,
  mediaType,
  refs,
  document,
}: {
  contentType: string
  mediaType: MediaTypeObject | null
  refs: Refs
  document: Document
}): SchemaObject | ReferenceObject | null {
  if (!mediaType || !isStream(contentType, mediaType)) return null
  // Below 3.2 there is no `itemSchema`, so `schema` on an event stream is the event by convention; from 3.2 it is the whole stream.
  const raw = mediaType.itemSchema ?? (isEventStream(contentType) && !isOpenApi32(document) ? mediaType.schema : undefined)
  if (!raw) return null

  return isEventStream(contentType) ? toEventSchema(raw, refs) : raw
}
