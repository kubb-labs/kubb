import type { SchemaKeywordMapper } from '@kubb/plugin-oas'
import { createParser, isKeyword, schemaKeywords } from '@kubb/plugin-oas'
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
      },
      {},
    )

    expect(result).toBe('Ref: TestRef')
  })
})
