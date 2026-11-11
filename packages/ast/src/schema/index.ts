import { narrowSchema } from '../guards.ts'
import { isJson } from '../mediaType/index.ts'
import type { SchemaNode, SchemaType, StringSchemaNode } from '../nodes/schema.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'])

/** The schema of the JSON document a string holds (`contentMediaType` with `contentSchema`), else `undefined`. */
export function jsonContent({ content }: Pick<StringSchemaNode, 'content'>): SchemaNode | undefined {
  // shortcut: an encoded document (`contentEncoding`) is not decoded, so only its encoding is checked; decode it once a spec needs both.
  if (!content?.schema || content.encoding || !content.mediaType) return undefined
  return isJson(content.mediaType) ? content.schema : undefined
}

/** Whether a schema prints as a plain `string`: string-like types, and `date` or `time` with a `'string'` representation. */
export function isString(node: SchemaNode): boolean {
  if (plainStringTypes.has(node.type)) return true
  const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
  return temporal ? temporal.representation !== 'date' : false
}
