import { ast } from '@kubb/kit'
import { extractExamples } from './schemaShape.ts'
import type { ConvertContext } from './parseSchema.ts'

/**
 * The `schema`/`name`/`nullable`/`defaultValue` slice of a context, the only part
 * {@link createNode} needs to fill in a node's shared base fields.
 */
type NodeBaseContext = Pick<ConvertContext, 'schema' | 'name' | 'nullable' | 'defaultValue'>

/**
 * Input shape accepted by `ast.factory.createSchema`, recovered from its own signature so
 * {@link createNode} stays in sync with the AST layer without redeclaring the union.
 */
type CreateSchemaProps = Parameters<typeof ast.factory.createSchema>[0]

const XML_NODE_TYPES = new Set(['element', 'attribute', 'text', 'cdata', 'none'])

/**
 * Reads the XML Object. The deprecated `attribute: true` and `wrapped: true` become the 3.2 `nodeType`.
 */
function getXml(xml: unknown): ast.XmlNode | undefined {
  if (!xml || typeof xml !== 'object') return undefined
  const { name, namespace, prefix, nodeType, attribute, wrapped } = xml as Record<string, unknown>
  const type =
    typeof nodeType === 'string' && XML_NODE_TYPES.has(nodeType) ? nodeType : attribute === true ? 'attribute' : wrapped === true ? 'element' : undefined
  const node = {
    ...(typeof name === 'string' && { name }),
    ...(typeof namespace === 'string' && { namespace }),
    ...(typeof prefix === 'string' && { prefix }),
    ...(type && { nodeType: type as ast.XmlNode['nodeType'] }),
  }
  return Object.keys(node).length ? node : undefined
}

/**
 * Builds a schema node from a converter's base context plus its type-specific fields. Every
 * converter needs the same metadata fields (`title`, `description`, `examples`, ...) alongside
 * whatever makes its node distinct; this folds both into one call.
 */
export function createNode({ schema, name, nullable, defaultValue }: NodeBaseContext, extras: CreateSchemaProps): ast.SchemaNode {
  return ast.factory.createSchema({
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
    xml: getXml(schema.xml),
    ...extras,
  })
}
