export { applyOptionality } from '../optionality.ts'
export { schemaTypes as types } from '../constants.ts'
export { narrowSchema as narrow } from '../guards.ts'
export { findSchema as find } from '../visitor.ts'
export { getEmbeddedJson } from './embeddedJson.ts'
import type { SchemaNode } from '../nodes/schema.ts'
import { is } from './is.ts'

export { is } from './is.ts'
export type { IsOptions, SchemaFollow, SchemaKind } from './is.ts'
export {
  getSchemaLiteralValues as getLiterals,
  inferDiscriminatorPropertyName as inferDiscriminator,
  resolveSchemaProperties as findProperties,
} from '../utils/schemaProperties.ts'

/** @deprecated Use `ast.schema.is(node, 'string')`. Removed in Kubb v6. */
export function isString(node: SchemaNode): boolean {
  return is(node, 'string')
}
