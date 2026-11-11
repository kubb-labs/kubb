import { isJson } from '../mediaType/index.ts'
import type { SchemaNode, StringSchemaNode } from '../nodes/schema.ts'

/** The schema of the JSON document a string holds (`contentMediaType` with `contentSchema`), else `undefined`. */
export function jsonContent({ content }: Pick<StringSchemaNode, 'content'>): SchemaNode | undefined {
  // shortcut: an encoded document (`contentEncoding`) is not decoded, so only its encoding is checked; decode it once a spec needs both.
  if (!content?.schema || content.encoding || !content.mediaType) return undefined
  return isJson(content.mediaType) ? content.schema : undefined
}
