import type { Document, SchemaObject } from '../types.ts'

const definitionPrefixes = ['#/$defs/', '#/definitions/'] as const

const rootKeywords = ['$schema', '$defs', 'definitions', '$ref', 'type', 'properties', 'items', 'enum', 'const', 'allOf', 'anyOf', 'oneOf']

/**
 * True when `document` declares no `openapi` or `swagger` version and has a JSON Schema keyword at its root.
 */
export function isJsonSchemaDocument(document: unknown): document is SchemaObject & Record<string, unknown> {
  if (!document || typeof document !== 'object' || Array.isArray(document)) return false
  if ('openapi' in document || 'swagger' in document) return false

  return rootKeywords.some((key) => key in document)
}

/**
 * Wraps a JSON Schema in an OpenAPI 3.1 document. The root schema is named after its `title`
 * (`Schema` without one), each `$defs` or `definitions` entry becomes a sibling schema, and local
 * refs are rewritten to point into `components.schemas`.
 */
export function wrapJsonSchema(schema: SchemaObject & Record<string, unknown>): Document {
  const { $schema: _schema, $id: _id, $defs, definitions, ...root } = schema
  const localDefinitions = { ...(definitions as Record<string, unknown> | undefined), ...($defs as Record<string, unknown> | undefined) }

  let name = (typeof root.title === 'string' ? root.title : '').replace(/[^\w.-]/g, '') || 'Schema'
  while (name in localDefinitions) name = `${name}Schema`
  const rootPointer = `#/components/schemas/${name}`

  const rewriteRef = (ref: string): string => {
    const prefix = definitionPrefixes.find((candidate) => ref.startsWith(candidate))
    if (prefix) return `#/components/schemas/${ref.slice(prefix.length)}`
    return ref === '#' || ref.startsWith('#/') ? `${rootPointer}${ref.slice(1)}` : ref
  }

  const rewriteRefs = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(rewriteRefs)
    if (!node || typeof node !== 'object') return node

    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, key === '$ref' && typeof value === 'string' ? rewriteRef(value) : rewriteRefs(value)]),
    )
  }

  const document: Document = {
    openapi: '3.1.0',
    info: { title: name, version: '0.0.0' },
    paths: {},
    components: {
      schemas: rewriteRefs({ ...localDefinitions, [name]: root }) as NonNullable<Document['components']>['schemas'],
    },
  }

  return document
}
