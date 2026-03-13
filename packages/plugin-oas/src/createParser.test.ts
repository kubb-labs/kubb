import { createSchema } from '@kubb/ast'
import type { SchemaKeywordMapper } from '@kubb/plugin-oas'
import { createParser, createParserSchemaNode, isKeyword, schemaKeywords } from '@kubb/plugin-oas'
import { describe, expect, it } from 'vitest'

describe('createParser type narrowing', () => {
  it('should properly type narrow current in handlers', () => {
    const parse = createParser<string, {}>({
      mapper: {
        ref: () => 'ref',
        string: () => 'string',
        number: () => 'number',
        boolean: () => 'boolean',
      } as any,
      handlers: {
        ref(tree, _options) {
          const { current } = tree
          // After the handler is called for 'ref', current should be typed as SchemaKeywordMapper['ref']
          // This means we can access current.args.name without type errors

          // TypeScript should know that current has this structure:
          // { keyword: 'ref'; args: { name: string; $ref: string; path: KubbFile.Path; isImportable: boolean } }

          const name = current.args.name
          expect(name).toBeDefined()
          return `Ref: ${name}`
        },
        union(tree, options) {
          const { current } = tree
          // For union, current should be SchemaKeywordMapper['union']
          // which has args as an array of Schema

          const items = current.args.map((it) => this.parse({ ...tree, current: it }, options)).filter(Boolean)
          return `Union: ${items.join(', ')}`
        },
      },
    })

    // Test the ref handler
    const refSchema: SchemaKeywordMapper['ref'] = {
      keyword: 'ref',
      args: {
        name: 'TestRef',
        $ref: '#/components/schemas/TestRef',
        path: '/path/to/ref' as any,
        isImportable: true,
      },
    }

    const result = parse(
      {
        schema: {},
        parent: undefined,
        current: refSchema,
        siblings: [refSchema],
        schemaNode: createSchema({ type: 'ref', ref: 'Error' }),
      },
      {},
    )

    expect(result).toBe('Ref: TestRef')
  })

  it('should work with isKeyword in handlers', () => {
    const parse = createParser<string, {}>({
      mapper: {
        ref: () => 'ref',
        string: () => 'string',
      } as any,
      handlers: {
        ref(tree, _options) {
          const { current } = tree
          // Even though tree.current is already typed correctly,
          // isKeyword should still work as an additional runtime check
          if (!isKeyword(current, schemaKeywords.ref)) return undefined

          // After isKeyword check, TypeScript knows current is SchemaKeywordMapper['ref']
          return `Ref: ${current.args.name}`
        },
      },
    })

    const refSchema: SchemaKeywordMapper['ref'] = {
      keyword: 'ref',
      args: {
        name: 'TestRef',
        $ref: '#/components/schemas/TestRef',
        path: '/path/to/ref' as any,
        isImportable: true,
      },
    }

    const result = parse(
      {
        schema: {},
        parent: undefined,
        current: refSchema,
        siblings: [refSchema],
        schemaNode: createSchema({ type: 'ref', ref: 'Error' }),
      },
      {},
    )

    expect(result).toBe('Ref: TestRef')
  })
})

describe('createParserSchemaNode', () => {
  it('dispatches to the correct handler based on node.type', () => {
    const parse = createParserSchemaNode<string, {}>({
      handlers: {
        string(node) {
          const min = node.min !== undefined ? `.min(${node.min})` : ''
          const max = node.max !== undefined ? `.max(${node.max})` : ''
          return `z.string()${min}${max}`
        },
        number(node) {
          const min = node.min !== undefined ? `.min(${node.min})` : ''
          return `z.number()${min}`
        },
        boolean() {
          return 'z.boolean()'
        },
      },
    })

    expect(parse(createSchema({ type: 'string', min: 1, max: 100 }), {})).toBe('z.string().min(1).max(100)')
    expect(parse(createSchema({ type: 'number', min: 0 }), {})).toBe('z.number().min(0)')
    expect(parse(createSchema({ type: 'boolean' }), {})).toBe('z.boolean()')
  })

  it('falls back to the mapper when no handler is registered', () => {
    const parse = createParserSchemaNode<string, {}>({
      mapper: {
        unknown: () => 'z.unknown()',
        any: () => 'z.any()',
      },
      handlers: {},
    })

    expect(parse(createSchema({ type: 'unknown' }), {})).toBe('z.unknown()')
    expect(parse(createSchema({ type: 'any' }), {})).toBe('z.any()')
    expect(parse(createSchema({ type: 'boolean' }), {})).toBeUndefined()
  })

  it('provides recursive this.parse for composite nodes', () => {
    const parse = createParserSchemaNode<string, {}>({
      handlers: {
        union(node, options) {
          const members = node.members?.map((m) => this.parse(m, options)).filter(Boolean) ?? []
          return `z.union([${members.join(', ')}])`
        },
        string() {
          return 'z.string()'
        },
        number() {
          return 'z.number()'
        },
      },
    })

    const unionNode = createSchema({
      type: 'union',
      members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
    })

    expect(parse(unionNode, {})).toBe('z.union([z.string(), z.number()])')
  })

  it('types node correctly in handlers', () => {
    const parse = createParserSchemaNode<string, {}>({
      handlers: {
        object(node, options) {
          const props =
            node.properties
              ?.map((p) => {
                const value = this.parse(p.schema, options)
                return `${p.name}: ${value}`
              })
              .join(', ') ?? ''
          return `z.object({ ${props} })`
        },
        string() {
          return 'z.string()'
        },
      },
    })

    const objectNode = createSchema({
      type: 'object',
      properties: [
        { kind: 'Property', name: 'id', schema: createSchema({ type: 'string' }), required: true },
        { kind: 'Property', name: 'name', schema: createSchema({ type: 'string' }), required: false },
      ],
    })

    expect(parse(objectNode, {})).toBe('z.object({ id: z.string(), name: z.string() })')
  })

  it('returns undefined for unhandled types with no mapper', () => {
    const parse = createParserSchemaNode<string, {}>({
      handlers: {},
    })

    expect(parse(createSchema({ type: 'object' }), {})).toBeUndefined()
  })
})
