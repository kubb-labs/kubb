import { narrowSchema } from '../guards.ts'
import { getStreamFraming, isStream } from '../mediaType/index.ts'
import type { ContentNode } from '../nodes/content.ts'
import type { HttpOperationNode } from '../nodes/operation.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { is } from '../schema/is.ts'
import { resolveRef as getSchema } from '../utils/refs.ts'
import { getSchemaLiteralValues, resolveSchemaProperties } from '../utils/schemaProperties.ts'
import type { ResponseNode } from '../nodes/response.ts'
import { collectImportedRefNames } from '../utils/schemaGraph.ts'
import { isError, isSuccess } from './status.ts'

/** The `4xx` and `5xx` responses, ranges included. */
export function filterError(node: Pick<HttpOperationNode, 'responses'>): Array<ResponseNode> {
  return node.responses.filter((response) => isError(response.statusCode))
}

/** The ref names the response bodies import, in order, with repeats. */
export function getImportedNames(responses: ReadonlyArray<ResponseNode>): Array<string> {
  return responses.flatMap((response) => (response.content ?? []).flatMap((entry) => (entry.schema ? collectImportedRefNames(entry.schema) : [])))
}

export function filterSuccess(node: Pick<HttpOperationNode, 'responses'>): Array<ResponseNode> {
  return node.responses.filter((response) => isSuccess(response.statusCode))
}

/** The success response a client returns: one with a body first, then an exact code over a `2xx` range. */
export function findPrimary(node: Pick<HttpOperationNode, 'responses'>): ResponseNode | null {
  const responses = filterSuccess(node)
  const withBody = responses.filter((response) => response.content?.some((entry) => entry.contentType))
  const candidates = withBody.length ? withBody : responses
  return candidates.find((response) => !Number.isNaN(Number(response.statusCode))) ?? candidates[0] ?? null
}

/** How an operation streams its success responses, as {@link getStream} returns it. */
export type ResponseStream = {
  /** The primary success response's framing when it streams with one content type. */
  framing: 'events' | 'lines' | null
  /** `event` for a whole typed event, `data` for a typed payload, `line` for a JSON Lines value. */
  shape: 'event' | 'data' | 'line' | null
  /** Whether events keep `data` as text: all of them, the named ones, or none. */
  textEvents: boolean | Array<string>
  /** Whether the primary success response offers `text/event-stream`. */
  hasEventStream: boolean
  /** Whether a success response offers a stream next to other content types. */
  hasVariant: boolean
}

const isText = (schema: SchemaNode | null | undefined) => Boolean(schema) && is(schema!, 'text', { follow: ['ref'] })

function getTextEvents(entry: ContentNode, shape: ResponseStream['shape']): ResponseStream['textEvents'] {
  if (shape === 'data') return isText(entry.stream?.schema ?? entry.schema)
  if (shape !== 'event' || !entry.stream?.schema) return false

  const item = getSchema(entry.stream.schema)
  const events = narrowSchema(item, 'union')?.members ?? [item]
  // A discriminator makes each event an intersection of its `$ref` and the pinned `event`, so every part is read.
  const propertySchemas = (event: SchemaNode, propertyName: string) => resolveSchemaProperties({ node: event, propertyName }).map(({ schema }) => schema)
  const textEvents = events.filter((event) => {
    const dataSchemas = propertySchemas(event, 'data')
    return dataSchemas.length > 0 && dataSchemas.every(isText)
  })
  if (textEvents.length === events.length) return events.length > 0

  const eventNames = textEvents.map((event) => propertySchemas(event, 'event').flatMap((schema) => getSchemaLiteralValues(getSchema(schema))))
  return eventNames.length > 0 && eventNames.every((values) => values.length > 0) && [...new Set(eventNames.flat().map(String))]
}

/** How an operation streams its success responses, or `null` when none offers a stream. */
export function getStream(node: Pick<HttpOperationNode, 'responses'>): ResponseStream | null {
  const entries = findPrimary(node)?.content ?? []
  const entry = entries.length === 1 ? entries[0]! : undefined
  const framing = (entry && getStreamFraming(entry)) ?? null
  const shape = framing === 'events' ? (entry!.stream?.shape ?? 'data') : framing === 'lines' ? 'line' : null
  // Next to another type, a stream without a schema gets no typed variant, so it keeps the plain call.
  const hasEventStream = entries.some((item) => getStreamFraming(item) === 'events' && (entries.length === 1 || Boolean(item.schema)))
  const hasVariant = filterSuccess(node).some((response) => {
    const variants = (response.content ?? []).filter((item) => item.schema)
    return variants.length > 1 && variants.some((item) => isStream(item))
  })
  if (!shape && !hasEventStream && !hasVariant) return null

  return { framing, shape, textEvents: entry ? getTextEvents(entry, shape) : false, hasEventStream, hasVariant }
}

/** A union of refs to the success responses with a body, else every response with a body, else `null`. */
export function getUnion(
  node: HttpOperationNode,
  resolver: { response: { status(node: HttpOperationNode, statusCode: ResponseNode['statusCode']): string } },
): SchemaNode | null {
  const withSchema = node.responses.filter((response) => response.content?.some((entry) => entry.schema))
  const success = withSchema.filter((response) => isSuccess(response.statusCode))
  const responses = success.length > 0 ? success : withSchema
  if (responses.length === 0) return null

  return createSchema({
    type: 'union',
    members: responses.map((response) => createSchema({ type: 'ref', name: resolver.response.status(node, response.statusCode) })),
  })
}
