import { ast } from '@kubb/ast'
import { buildSchemaNode } from '../resolvers.ts'
import type { SchemaContext } from './parseSchema.ts'

/**
 * The `schema`/`name`/`nullable`/`defaultValue` slice of a context, the only part
 * {@link createNode} needs to fill in a node's shared base fields.
 */
type NodeBaseContext = Pick<SchemaContext, 'schema' | 'name' | 'nullable' | 'defaultValue'>

/**
 * Input shape accepted by `ast.factory.createSchema`, recovered from its own signature so
 * {@link createNode} stays in sync with the AST layer without redeclaring the union.
 */
type CreateSchemaProps = Parameters<typeof ast.factory.createSchema>[0]

/**
 * Builds a schema node from a converter's base context plus its type-specific fields. Every
 * converter ends with the same `...buildSchemaNode(schema, name, nullable, defaultValue)` spread;
 * this folds that into one call so converters only supply what makes their node distinct.
 */
export function createNode({ schema, name, nullable, defaultValue }: NodeBaseContext, extras: CreateSchemaProps): ast.SchemaNode {
  return ast.factory.createSchema({
    ...buildSchemaNode(schema, name, nullable, defaultValue),
    ...extras,
  })
}
