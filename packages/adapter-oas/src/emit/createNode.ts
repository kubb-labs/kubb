import { ast } from '@kubb/ast'
import { extractExamples } from './schemaHelpers.ts'
import type { SchemaContext } from './parseSchema.ts'
import type { SchemaObject } from '../types.ts'

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
 * Collects the shared metadata fields passed to every `createSchema` call.
 */
export function buildSchemaNode(schema: SchemaObject, name: string | null | undefined, nullable: true | undefined, defaultValue: unknown) {
  return {
    name,
    nullable,
    title: schema.title,
    description: schema.description,
    deprecated: schema.deprecated,
    readOnly: schema.readOnly,
    writeOnly: schema.writeOnly,
    default: defaultValue,
    examples: extractExamples(schema),
    format: schema.format,
  } as const
}

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
