import { ast } from '@kubb/kit'
import { isJsonMimeType, isOpenApi32, isReference } from '../oas.ts'
import type { Refs } from '../refs.ts'
import type { Document, MediaTypeObject, ReferenceObject, SchemaObject } from '../types.ts'

/**
 * Returns `true` for a media type read as a stream of items: one `ast.mediaType.isStream` accepts, or any that declares `itemSchema`.
 */
export function isStream(contentType: string, mediaType: MediaTypeObject | null): boolean {
  return ast.mediaType.isStream(contentType) || mediaType?.itemSchema !== undefined
}

/**
 * Whether the media type is `text/event-stream`, with or without parameters.
 */
export function isEventStream(contentType: string): boolean {
  return ast.mediaType.base(contentType) === 'text/event-stream'
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
 * Property names of the schema and its `allOf` members, following `$ref`s, as one combined object declares them.
 */
function collectFields(schema: SchemaObject | ReferenceObject, refs: Refs, seen: Set<string>): Array<string> {
  if (isReference(schema)) {
    if (seen.has(schema.$ref)) return []
    seen.add(schema.$ref)
    const resolved = refs.resolve<SchemaObject | ReferenceObject>(schema.$ref, { report: false })
    return resolved ? collectFields(resolved, refs, seen) : []
  }
  const members = (schema.allOf ?? []) as Array<SchemaObject | ReferenceObject>
  return [...Object.keys(schema.properties ?? {}), ...members.flatMap((member) => collectFields(member, refs, seen))]
}

/**
 * Whether the schema, following `$ref`s, or a `oneOf`/`anyOf` member of it is a whole Server-Sent Event: its combined
 * `allOf` fields declare `data`, or `event` with no field an event cannot carry. An `event` next to fields such as
 * `planet` is the payload's own property, sent as JSON in the `data:` line.
 */
function declaresEventFields(schema: SchemaObject | ReferenceObject, refs: Refs, seen: Set<string>): boolean {
  if (isReference(schema)) {
    if (seen.has(schema.$ref)) return false
    seen.add(schema.$ref)
    const resolved = refs.resolve<SchemaObject | ReferenceObject>(schema.$ref, { report: false })
    return !!resolved && declaresEventFields(resolved, refs, seen)
  }
  const fields = collectFields(schema, refs, new Set(seen))
  if (fields.includes('data')) return true
  if (fields.includes('event')) return fields.every((field) => SSE_FIELDS.has(field))

  const members = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])] as Array<SchemaObject | ReferenceObject>
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

// A stream without a schema is a `blob` with a string primitive, so it keeps the JSON-parse default.
function isTextSchema(schema: ast.SchemaNode | undefined): boolean {
  if (!schema) return false
  const resolved = ast.ref.resolve(schema)
  return resolved.type !== 'blob' && resolved.primitive === 'string'
}

/**
 * Whether the events of a `text/event-stream` type `data` as a string: `true` when all do, else the names of the events that
 * do. `undefined` when none do, or when one of those events has no fixed name.
 */
export function getTextData(item: ast.SchemaNode, shape: 'event' | 'data'): true | Array<string> | undefined {
  if (shape === 'data') return isTextSchema(item) ? true : undefined

  const resolved = ast.ref.resolve(item)
  const events = resolved.type === 'union' ? (ast.narrowSchema(resolved, 'union')?.members ?? []) : [resolved]
  // A discriminator makes each event an intersection of its `$ref` and the pinned `event`, so every part is read.
  const propertySchemas = (event: ast.SchemaNode, propertyName: string) => ast.schema.properties({ node: event, propertyName }).map(({ schema }) => schema)
  const textEvents = events.filter((event) => {
    const dataSchemas = propertySchemas(event, 'data')
    return dataSchemas.length > 0 && dataSchemas.every(isTextSchema)
  })
  if (!textEvents.length) return undefined
  if (textEvents.length === events.length) return true

  const eventNames = textEvents.map((event) => propertySchemas(event, 'event').flatMap((schema) => ast.schema.literalValues(ast.ref.resolve(schema))))
  return eventNames.every((values) => values.length > 0) ? [...new Set(eventNames.flat().map(String))] : undefined
}
