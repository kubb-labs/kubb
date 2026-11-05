import { STREAM_MEDIA_TYPES } from '../constants.ts'
import { isJsonMimeType, isOpenApi32, isReference } from '../oas.ts'
import type { Refs } from '../refs.ts'
import type { Document, MediaTypeObject, ReferenceObject, SchemaObject } from '../types.ts'

/** The media type without its parameters, so `text/event-stream; charset=utf-8` matches the bare name. */
function baseMediaType(contentType: string): string {
  return contentType.split(';')[0]!.trim().toLowerCase()
}

/**
 * Returns `true` for a media type read as a stream of items: one that OpenAPI 3.2 lists, or any that declares `itemSchema`.
 */
export function isStream(contentType: string, mediaType: MediaTypeObject | null): boolean {
  return STREAM_MEDIA_TYPES.has(baseMediaType(contentType)) || mediaType?.itemSchema !== undefined
}

/** Whether the media type is `text/event-stream`, with or without parameters. */
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
 * merge into each inline `oneOf`/`anyOf` member and a JSON `data` string becomes its `contentSchema`.
 */
export function toEventSchema(schema: SchemaObject | ReferenceObject, refs: Refs): SchemaObject | ReferenceObject {
  if (isReference(schema)) return schema
  const key = schema.oneOf?.length ? 'oneOf' : schema.anyOf?.length ? 'anyOf' : undefined
  if (!key) return withParsedData(schema, refs)

  const members = schema[key] as Array<SchemaObject | ReferenceObject>
  const { properties, required, ...rest } = schema
  // A `$ref` member stays a reference, so the shared properties can only move into members when every member is inline.
  const merge = !!properties && !members.some(isReference)
  const mergeShared = (member: SchemaObject): SchemaObject => {
    if (!merge) return member
    const memberRequired = [...new Set([...(Array.isArray(required) ? required : []), ...(Array.isArray(member.required) ? member.required : [])])]
    const merged = {
      type: 'object',
      ...member,
      properties: { ...properties, ...member.properties },
      ...(memberRequired.length ? { required: memberRequired } : {}),
    }
    return merged as SchemaObject
  }

  const event = { ...(merge ? rest : schema), [key]: members.map((member) => (isReference(member) ? member : withParsedData(mergeShared(member), refs))) }
  return event as SchemaObject
}

/** Whether the schema, or a composition member of it, declares an `event` or `data` property. */
function declaresEventFields(schema: SchemaObject | ReferenceObject, refs: Refs, seen: Set<string>): boolean {
  const resolved = (() => {
    if (!isReference(schema)) return schema
    if (seen.has(schema.$ref)) return null
    seen.add(schema.$ref)
    return refs.resolve<SchemaObject>(schema.$ref, { report: false })
  })()
  if (!resolved) return false
  if (resolved.properties && (Object.hasOwn(resolved.properties, 'event') || Object.hasOwn(resolved.properties, 'data'))) return true

  const members = [...(resolved.oneOf ?? []), ...(resolved.anyOf ?? []), ...(resolved.allOf ?? [])] as Array<SchemaObject | ReferenceObject>
  return members.some((member) => declaresEventFields(member, refs, seen))
}

/**
 * Returns `'event'` when the item declares `event` or `data`, directly or in a composition member, else `'data'`.
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
