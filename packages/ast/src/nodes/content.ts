import { type BaseNode, nodeFactory } from './base.ts'
import type { SchemaNode } from './schema.ts'

/** One content-type entry of a request body or response, holding its own body schema. */
export type ContentNode = BaseNode & {
  kind: 'Content'
  /** For example `'application/json'`. */
  contentType: string
  schema?: SchemaNode
  /** Property keys to exclude via `Omit<Type, Keys>`, set when a referenced schema has `readOnly`/`writeOnly` fields. */
  keysToOmit?: Array<string> | null
}

export const createContent = nodeFactory<ContentNode>('Content')
