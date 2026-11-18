import { describe, expect, it } from 'vitest'
import { createContent } from './nodes/content.ts'
import { createInput } from './nodes/input.ts'
import { createOperation } from './nodes/operation.ts'
import { createParameter } from './nodes/parameter.ts'
import { createProperty } from './nodes/property.ts'
import { createResponse } from './nodes/response.ts'
import { createSchema } from './nodes/schema.ts'
import type { InputNode } from './nodes/input.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { collect, findSchema, transform } from './visitor.ts'

/**
 * Builds a minimal sample AST with one `Pet` schema and one `getPetById` operation.
 */
function buildSampleTree(): InputNode {
  const petSchema = createSchema({
    type: 'object',
    name: 'Pet',
    properties: [
      createProperty({
        name: 'id',
        schema: createSchema({ type: 'integer' }),
        required: true,
      }),
      createProperty({
        name: 'name',
        schema: createSchema({ type: 'string' }),
        required: true,
      }),
    ],
  })

  const operation = createOperation({
    operationId: 'getPetById',
    method: 'GET',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [
      createParameter({
        name: 'petId',
        in: 'path',
        schema: createSchema({ type: 'integer' }),
        required: true,
      }),
    ],
    responses: [
      createResponse({
        statusCode: '200',
        content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'ref', name: 'Pet' }) })],
      }),
      createResponse({
        statusCode: '404',
        content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'ref', name: 'Error' }) })],
      }),
    ],
  })

  return createInput({ schemas: [petSchema], operations: [operation] })
}

describe('transform', () => {
  it('preserves identity with no visitors', () => {
    const root = buildSampleTree()

    expect(transform(root, {})).toBe(root)
  })

  it('rebuilds the changed branch and reuses untouched subtrees when a visitor returns a new node', () => {
    const root = buildSampleTree()
    const result = transform(root, {
      operation(op): OperationNode {
        return { ...op, operationId: `api_${op.operationId}` }
      },
    })

    // The root and the operations branch are rebuilt...
    expect(result).not.toBe(root)
    expect(result.operations).not.toBe(root.operations)
    expect(result.operations[0]?.operationId).toBe('api_getPetById')
    // ...the original is left as is...
    expect(root.operations[0]?.operationId).toBe('getPetById')
    // ...and the untouched schemas branch keeps its references.
    expect(result.schemas).toBe(root.schemas)
    expect(result.schemas[0]).toBe(root.schemas[0])
  })

  it('rebuilds a schema inside patternProperties and keeps the record when nothing changes', () => {
    const root = createInput({
      schemas: [createSchema({ type: 'object', name: 'Map', properties: [], patternProperties: { '^x-': createSchema({ type: 'ref', name: 'Extension' }) } })],
    })

    const renamed = transform(root, {
      schema(n): SchemaNode {
        return n.type === 'ref' ? { ...n, name: 'Renamed' } : n
      },
    })
    const untouched = transform(root, { schema: (n) => n })

    const map = renamed.schemas[0]
    expect(map?.type === 'object' ? map.patternProperties?.['^x-']?.name : undefined).toBe('Renamed')
    expect(untouched).toBe(root)
  })

  it('visits parameter schemas but not property schemas when depth: shallow', () => {
    const root = buildSampleTree()
    const types: Array<string> = []
    transform(root, {
      depth: 'shallow',
      schema(schema): SchemaNode {
        types.push(schema.type)
        return schema
      },
    })

    // Parameter schema (integer) is still visited: it is not a schema property
    expect(types).toContain('integer')
    // 'string' (Pet.name property schema) is not visited: guarded by depth
    expect(types).not.toContain('string')
  })
})

describe('a node under two keys', () => {
  const item = createSchema({ type: 'string' })
  const content = createContent({ contentType: 'text/event-stream', schema: item, stream: { schema: item, shape: 'data' } })

  it('is collected once', () => {
    expect(collect<SchemaNode>(content, { schema: (node) => node })).toHaveLength(1)
  })

  it('is transformed once, so both keys keep one node', () => {
    const next = transform(content, { schema: (node) => ({ ...node, description: 'd' }) })

    expect(next.schema?.description).toBe('d')
    expect(next.stream?.schema).toBe(next.schema)
  })
})

describe('VisitorContext — parent', () => {
  it('passes the owning schema as parent to the property visitor', () => {
    const root = createInput({
      schemas: [
        createSchema({
          type: 'object',
          name: 'Pet',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string' }), required: false })],
        }),
        createSchema({
          type: 'object',
          name: 'Order',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string' }), required: false })],
        }),
      ],
    })

    const result = transform(root, {
      property(prop, { parent }) {
        if (parent?.kind === 'Schema' && 'name' in parent && parent.name === 'Pet' && prop.name === 'tag') {
          return { ...prop, required: true }
        }
      },
    })

    const [pet, order] = result.schemas
    expect(pet?.type === 'object' ? pet.properties[0]?.required : undefined).toBe(true)
    expect(order?.type === 'object' ? order.properties[0]?.required : undefined).toBe(false)
  })

  it('passes the Input node as parent to schema and operation visitors and no parent to the input visitor', () => {
    const root = buildSampleTree()
    const parents: Record<string, string | undefined> = {}

    transform(root, {
      input(_node, { parent }) {
        parents.input = parent === undefined ? 'none' : 'some'
      },
      schema(_node, { parent }) {
        parents.schema ??= parent?.kind
      },
      operation(_node, { parent }) {
        parents.operation = parent?.kind
      },
    })

    expect(parents).toStrictEqual({ input: 'none', schema: 'Input', operation: 'Input' })
  })
})

describe('collect', () => {
  it('collects schemas inside a tuple rest and patternProperties', () => {
    const root = createInput({
      schemas: [
        createSchema({ type: 'tuple', name: 'Pair', items: [createSchema({ type: 'string' })], rest: createSchema({ type: 'ref', name: 'Tail' }) }),
        createSchema({ type: 'object', name: 'Map', properties: [], patternProperties: { '^x-': createSchema({ type: 'ref', name: 'Extension' }) } }),
      ],
    })

    const names = collect<string>(root, {
      schema(n) {
        return n.type === 'ref' ? (n.name ?? undefined) : undefined
      },
    })

    expect(names).toStrictEqual(['Tail', 'Extension'])
  })
})

describe('response headers', () => {
  it('are visited as parameters with their schemas', () => {
    const header = createParameter({
      name: 'X-Rate-Limit',
      in: 'header',
      schema: createSchema({ type: 'ref', name: 'RateLimit', ref: '#/components/schemas/RateLimit' }),
    })
    const response = createResponse({ statusCode: '200', headers: [header] })

    expect(collect<ParameterNode>(response, { parameter: (node) => node })).toStrictEqual([header])
    expect(collect<SchemaNode>(response, { schema: (node) => (node.type === 'ref' ? node : undefined) })).toHaveLength(1)
  })
})

describe('findSchema', () => {
  const isString = (schema: SchemaNode) => schema.type === 'string'

  // Builds a named object whose properties are refs to the given targets, wired up after creation so cycles can form.
  function objectOf(name: string, extra: Array<SchemaNode> = []) {
    const refs: Array<SchemaNode> = []
    const node = createSchema({ type: 'object', name, properties: [] })
    const link = (...targets: Array<SchemaNode>) => {
      for (const target of targets) refs.push(createSchema({ type: 'ref', name: target.name ?? undefined, schema: target }))
      Object.assign(node, {
        properties: [...refs, ...extra].map((schema, index) => createProperty({ name: `p${index}`, schema, required: true })),
      })
    }
    link()
    return { node, link }
  }

  it('returns the first match and undefined without one', () => {
    const tree = buildSampleTree()

    expect(findSchema(tree, { predicate: isString })).toMatchObject({ type: 'string' })
    expect(findSchema(tree, { predicate: (schema) => schema.type === 'boolean' })).toBeUndefined()
  })

  it('ends on a self-referencing schema', () => {
    const tree = objectOf('Tree')
    tree.link(tree.node)
    const cache = new WeakMap<SchemaNode, SchemaNode | null>()

    expect(findSchema(tree.node, { predicate: isString, followRefs: true })).toBeUndefined()
    expect(findSchema(tree.node, { predicate: isString, followRefs: true, cache })).toBeUndefined()
    expect(cache.get(tree.node)).toBeNull()
  })

  it('finds a match in mutually recursive schemas, cached or not', () => {
    const a = objectOf('A')
    const b = objectOf('B')
    const c = objectOf('C')
    const d = objectOf('D', [createSchema({ type: 'string' })])
    // A -> B -> A and A -> C -> B: when B first returns, A still has D, which matches, left to walk.
    b.link(a.node)
    c.link(b.node)
    a.link(b.node, c.node, d.node)
    const cache = new WeakMap<SchemaNode, SchemaNode | null>()

    for (const start of [a, b, c, d]) {
      const uncached = findSchema(start.node, { predicate: isString, followRefs: true })
      expect(uncached?.type).toBe('string')
      expect(findSchema(start.node, { predicate: isString, followRefs: true, cache })).toBe(uncached)
    }
    expect(findSchema(b.node, { predicate: isString, followRefs: true, cache: new WeakMap() })).toMatchObject({ type: 'string' })
  })

  it('does not cache a no-match for a schema whose cycle is still being walked', () => {
    const a = objectOf('A')
    const b = objectOf('B')
    const c = objectOf('C')
    const d = objectOf('D', [createSchema({ type: 'string' })])
    b.link(a.node)
    c.link(b.node)
    a.link(b.node, c.node, d.node)
    const cache = new WeakMap<SchemaNode, SchemaNode | null>()

    expect(findSchema(a.node, { predicate: isString, followRefs: true, cache })).toMatchObject({ type: 'string' })
    expect(cache.get(b.node)).toBeUndefined()
    expect(cache.get(c.node)).toBeUndefined()
    expect(findSchema(c.node, { predicate: isString, followRefs: true, cache })).toMatchObject({ type: 'string' })
  })

  it('does not cache a no-match through a cycle that a sibling branch reaches again', () => {
    const root = objectOf('Root')
    const y = objectOf('Y')
    const p = objectOf('P')
    const z = objectOf('Z')
    const w = objectOf('W')
    const m = objectOf('M', [createSchema({ type: 'string' })])
    // Y and Z sit at the same depth. W reaches P, which reaches Y, which reaches Root, which reaches M.
    p.link(y.node)
    y.link(p.node, root.node)
    w.link(p.node)
    z.link(w.node)
    root.link(y.node, z.node, m.node)
    const cache = new WeakMap<SchemaNode, SchemaNode | null>()

    expect(findSchema(root.node, { predicate: isString, followRefs: true, cache })).toMatchObject({ type: 'string' })
    expect(cache.get(w.node)).not.toBeNull()
    expect(findSchema(w.node, { predicate: isString, followRefs: true, cache })).toMatchObject({ type: 'string' })
  })

  it('caches a no-match for a whole cycle once it is walked', () => {
    const a = objectOf('A')
    const b = objectOf('B')
    a.link(b.node)
    b.link(a.node)
    const cache = new WeakMap<SchemaNode, SchemaNode | null>()

    expect(findSchema(a.node, { predicate: isString, followRefs: true, cache })).toBeUndefined()
    expect(cache.get(a.node)).toBeNull()
    expect(cache.get(b.node)).toBeNull()
  })

  it('gives the same answer from a warm cache as without one', () => {
    const tree = buildSampleTree()
    const cache = new WeakMap<SchemaNode, SchemaNode | null>()
    const options = { predicate: isString, followRefs: true }

    const uncached = findSchema(tree, options)
    expect(findSchema(tree, { ...options, cache })).toBe(uncached)
    expect(findSchema(tree, { ...options, cache })).toBe(uncached)
  })
})
