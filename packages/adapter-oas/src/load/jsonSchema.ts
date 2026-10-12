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

  // Component keys may only hold `[A-Za-z0-9_.-]`, so names are stripped and suffixed until unique.
  const usedKeys = new Set<string>()
  const claimKey = (raw: string): string => {
    let key = raw.replace(/[^\w.-]/g, '') || 'Schema'
    while (usedKeys.has(key)) key = `${key}Schema`
    usedKeys.add(key)
    return key
  }
  const definitionKeys = new Map(Object.keys(localDefinitions).map((raw) => [raw, claimKey(raw)]))
  const name = claimKey(typeof root.title === 'string' ? root.title : '')
  const rootPointer = `#/components/schemas/${name}`

  const rewriteRef = (ref: string): string => {
    const prefix = definitionPrefixes.find((candidate) => ref.startsWith(candidate))
    if (prefix) {
      const [token = '', ...rest] = ref.slice(prefix.length).split('/')
      const raw = token.replaceAll('~1', '/').replaceAll('~0', '~')
      return ['#/components/schemas', definitionKeys.get(raw) ?? token, ...rest].join('/')
    }
    return ref === '#' || ref.startsWith('#/') ? `${rootPointer}${ref.slice(1)}` : ref
  }

  const rewriteRefs = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(rewriteRefs)
    if (!node || typeof node !== 'object') return node

    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, key === '$ref' && typeof value === 'string' ? rewriteRef(value) : rewriteRefs(value)]),
    )
  }

  const schemas = Object.fromEntries([...Object.entries(localDefinitions).map(([raw, definition]) => [definitionKeys.get(raw), definition]), [name, root]])

  const document: Document = {
    openapi: '3.1.0',
    info: { title: name, version: '0.0.0' },
    paths: {},
    components: {
      schemas: rewriteRefs(schemas) as NonNullable<Document['components']>['schemas'],
    },
  }

  return document
}
