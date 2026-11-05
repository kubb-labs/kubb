import { SEQUENTIAL_MEDIA_TYPES } from '../constants.ts'
import { isJsonMimeType, isReference } from '../oas.ts'
import type { Refs } from '../refs.ts'
import type { Document, MediaTypeObject, ReferenceObject, SchemaObject } from '../types.ts'

function baseMediaType(contentType: string): string {
  return contentType.split(';')[0]!.trim().toLowerCase()
}

/**
 * Returns `true` for an OpenAPI 3.2 sequential media type, or for any media type that declares `itemSchema`.
 */
export function isSequential(contentType: string, mediaType: MediaTypeObject | null): boolean {
  return SEQUENTIAL_MEDIA_TYPES.has(baseMediaType(contentType)) || mediaType?.itemSchema !== undefined
}

export function isEventStream(contentType: string): boolean {
  return baseMediaType(contentType) === 'text/event-stream'
}

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
  if (members.some(isReference)) {
    // A named member stays a reference, so only the inline members get their `data` parsed.
    const mixed = { ...schema, [key]: members.map((member) => (isReference(member) ? member : withParsedData(member, refs))) }
    return mixed as SchemaObject
  }

  const { properties, required, ...rest } = schema
  const mergeShared = (member: SchemaObject): SchemaObject => {
    if (!properties) return member
    const memberRequired = [...new Set([...(Array.isArray(required) ? required : []), ...(Array.isArray(member.required) ? member.required : [])])]
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
 * Returns `'event'` when the item declares `event` or `data`, directly or in a composition member, else `'data'`.
 */
export function getItemShape(schema: SchemaObject | ReferenceObject, refs: Refs): 'event' | 'data' {
  return declaresEventFields(schema, refs, new Set()) ? 'event' : 'data'
}

/**
 * Whether `schema` on `text/event-stream` describes one event: documents below OpenAPI 3.2 have no
 * `itemSchema`, so `schema` is the event by convention. From 3.2 it describes the complete stream.
 */
export function usesEventSchemaAsItem(document: Document): boolean {
  const [major = 0, minor = 0] = String(document.openapi ?? '3.1')
    .split('.')
    .map(Number)
  return major < 3 || (major === 3 && minor < 2)
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
  if (!mediaType || !isSequential(contentType, mediaType)) return null
  const raw = mediaType.itemSchema ?? (isEventStream(contentType) && usesEventSchemaAsItem(document) ? mediaType.schema : undefined)
  if (!raw) return null

  return isEventStream(contentType) ? toEventSchema(raw, refs) : raw
}
