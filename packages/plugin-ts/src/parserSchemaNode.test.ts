/**
 * Parity tests: `parseSchemaNode` (SchemaNode-based) vs the legacy `parse` (Schema[]-based).
 *
 * Each case provides:
 *   - a hand-crafted `Schema` keyword node (the legacy `Schema[]` input)
 *   - an equivalent `SchemaNode` produced by `createSchema`
 *
 * Both are printed with `safePrint` and the strings must match.
 */
import { createSchema } from '@internals/ast'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'
import { schemaKeywords } from '@kubb/plugin-oas'
import type ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { parse } from './parser.ts'
import { parseSchemaNode } from './parserSchemaNode.ts'

// ─── helpers ─────────────────────────────────────────────────────────────────

const defaultOptions = {
  optionalType: 'questionToken' as const,
  arrayType: 'array' as const,
  enumType: 'inlineLiteral' as const,
}

const unknownNode = createSchema({ type: 'unknown' })

/** Run both parsers and return their printed output strings (trailing whitespace stripped). */
function fromTree(schema: Parameters<typeof parse>[0]['current'], name = 'Test') {
  const schemaNode = unknownNode
  const node = parse({ name, schema: {}, parent: undefined, current: schema, siblings: [schema], schemaNode }, defaultOptions)
  return node ? safePrint(node as ts.Node).trim() : undefined
}

function fromNode(node: Parameters<typeof parseSchemaNode>[0]) {
  const result = parseSchemaNode(node, defaultOptions)
  return result ? safePrint(result).trim() : undefined
}

// ─── primitive scalars ────────────────────────────────────────────────────────

describe('parseSchemaNode parity — primitives', () => {
  it('string', () => {
    const tree = fromTree({ keyword: schemaKeywords.string })
    const node = fromNode(createSchema({ type: 'string' }))
    expect(node).toBe(tree)
    expect(node).toBe('string')
  })

  it('number', () => {
    const tree = fromTree({ keyword: schemaKeywords.number })
    const node = fromNode(createSchema({ type: 'number' }))
    expect(node).toBe(tree)
    expect(node).toBe('number')
  })

  it('integer', () => {
    const tree = fromTree({ keyword: schemaKeywords.integer })
    const node = fromNode(createSchema({ type: 'integer' }))
    expect(node).toBe(tree)
    expect(node).toBe('number')
  })

  it('bigint', () => {
    const tree = fromTree({ keyword: schemaKeywords.bigint })
    const node = fromNode(createSchema({ type: 'bigint' }))
    expect(node).toBe(tree)
    expect(node).toBe('bigint')
  })

  it('boolean', () => {
    const tree = fromTree({ keyword: schemaKeywords.boolean })
    const node = fromNode(createSchema({ type: 'boolean' }))
    expect(node).toBe(tree)
    expect(node).toBe('boolean')
  })

  it('null', () => {
    const tree = fromTree({ keyword: schemaKeywords.null })
    const node = fromNode(createSchema({ type: 'null' }))
    expect(node).toBe(tree)
    expect(node).toBe('null')
  })

  it('unknown', () => {
    const tree = fromTree({ keyword: schemaKeywords.unknown })
    const node = fromNode(createSchema({ type: 'unknown' }))
    expect(node).toBe(tree)
    expect(node).toBe('unknown')
  })

  it('any', () => {
    const tree = fromTree({ keyword: schemaKeywords.any })
    const node = fromNode(createSchema({ type: 'any' }))
    expect(node).toBe(tree)
    expect(node).toBe('any')
  })

  it('void', () => {
    const tree = fromTree({ keyword: schemaKeywords.void })
    const node = fromNode(createSchema({ type: 'void' }))
    expect(node).toBe(tree)
    expect(node).toBe('void')
  })

  it('blob', () => {
    const tree = fromTree({ keyword: schemaKeywords.blob })
    const node = fromNode(createSchema({ type: 'blob' }))
    expect(node).toBe(tree)
    expect(node).toBe('Blob')
  })
})

// ─── formats / well-known scalars ─────────────────────────────────────────────

describe('parseSchemaNode parity — formats', () => {
  it('uuid → string', () => {
    const tree = fromTree({ keyword: schemaKeywords.uuid })
    const node = fromNode(createSchema({ type: 'uuid' }))
    expect(node).toBe(tree)
    expect(node).toBe('string')
  })

  it('email → string', () => {
    const tree = fromTree({ keyword: schemaKeywords.email })
    const node = fromNode(createSchema({ type: 'email' }))
    expect(node).toBe(tree)
    expect(node).toBe('string')
  })

  it('url → string', () => {
    const tree = fromTree({ keyword: schemaKeywords.url })
    const node = fromNode(createSchema({ type: 'url' }))
    expect(node).toBe(tree)
    expect(node).toBe('string')
  })

  it('datetime → string', () => {
    const tree = fromTree({ keyword: schemaKeywords.datetime, args: { offset: false } })
    const node = fromNode(createSchema({ type: 'datetime', offset: false }))
    expect(node).toBe(tree)
    expect(node).toBe('string')
  })

  it('date (string representation) → string', () => {
    const tree = fromTree({ keyword: schemaKeywords.date, args: { type: 'string' } })
    const node = fromNode(createSchema({ type: 'date', representation: 'string' }))
    expect(node).toBe(tree)
    expect(node).toBe('string')
  })

  it('date (Date representation) → Date', () => {
    const tree = fromTree({ keyword: schemaKeywords.date, args: { type: 'date' } })
    const node = fromNode(createSchema({ type: 'date', representation: 'date' }))
    expect(node).toBe(tree)
    expect(node).toBe('Date')
  })

  it('time (string representation) → string', () => {
    const tree = fromTree({ keyword: schemaKeywords.time, args: { type: 'string' } })
    const node = fromNode(createSchema({ type: 'time', representation: 'string' }))
    expect(node).toBe(tree)
    expect(node).toBe('string')
  })
})

// ─── ref ──────────────────────────────────────────────────────────────────────

describe('parseSchemaNode parity — ref', () => {
  it('$ref → type reference', () => {
    const tree = fromTree({ keyword: schemaKeywords.ref, args: { name: 'Pet', $ref: '#/components/schemas/Pet', path: '/Pet' as any, isImportable: true } })
    const node = fromNode(createSchema({ type: 'ref', name: 'Pet' }))
    expect(node).toBe(tree)
    expect(node).toBe('Pet')
  })
})

// ─── enum (inlineLiteral) ─────────────────────────────────────────────────────

describe('parseSchemaNode parity — enum inlineLiteral', () => {
  it('string enum', () => {
    const tree = fromTree({
      keyword: schemaKeywords.enum,
      args: {
        name: 'Status',
        typeName: 'Status',
        asConst: false,
        items: [
          { name: '"active"', value: 'active', format: 'string' },
          { name: '"inactive"', value: 'inactive', format: 'string' },
        ],
      },
    })
    const node = fromNode(
      createSchema({
        type: 'enum',
        name: 'Status',
        namedEnumValues: [
          { name: 'active', value: 'active', format: 'string' },
          { name: 'inactive', value: 'inactive', format: 'string' },
        ],
      }),
    )
    expect(node).toBe(tree)
    expect(node).toContain('"active"')
    expect(node).toContain('"inactive"')
  })

  it('number enum', () => {
    const tree = fromTree({
      keyword: schemaKeywords.enum,
      args: {
        name: 'Priority',
        typeName: 'Priority',
        asConst: false,
        items: [
          { name: '1', value: 1, format: 'number' },
          { name: '2', value: 2, format: 'number' },
        ],
      },
    })
    const node = fromNode(
      createSchema({
        type: 'enum',
        name: 'Priority',
        enumType: 'number',
        namedEnumValues: [
          { name: '1', value: 1, format: 'number' },
          { name: '2', value: 2, format: 'number' },
        ],
      }),
    )
    expect(node).toBe(tree)
    expect(node).toContain('1')
    expect(node).toContain('2')
  })
})

// ─── union ────────────────────────────────────────────────────────────────────

describe('parseSchemaNode parity — union', () => {
  it('union of string | number', () => {
    const tree = fromTree({
      keyword: schemaKeywords.union,
      args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
    })
    const node = fromNode(
      createSchema({
        type: 'union',
        members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
      }),
    )
    expect(node).toBe(tree)
    expect(node).toContain('string')
    expect(node).toContain('number')
  })

  it('union of three types', () => {
    const tree = fromTree({
      keyword: schemaKeywords.union,
      args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }, { keyword: schemaKeywords.boolean }],
    })
    const node = fromNode(
      createSchema({
        type: 'union',
        members: [createSchema({ type: 'string' }), createSchema({ type: 'number' }), createSchema({ type: 'boolean' })],
      }),
    )
    expect(node).toBe(tree)
  })
})

// ─── intersection ─────────────────────────────────────────────────────────────

describe('parseSchemaNode parity — intersection', () => {
  it('and of string & number', () => {
    const tree = fromTree({
      keyword: schemaKeywords.and,
      args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
    })
    const node = fromNode(
      createSchema({
        type: 'intersection',
        members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
      }),
    )
    expect(node).toBe(tree)
    expect(node).toContain('&')
  })
})

// ─── array ────────────────────────────────────────────────────────────────────

describe('parseSchemaNode parity — array', () => {
  it('array of string', () => {
    const tree = fromTree({
      keyword: schemaKeywords.array,
      args: { items: [{ keyword: schemaKeywords.string }] },
    })
    const node = fromNode(
      createSchema({
        type: 'array',
        items: [createSchema({ type: 'string' })],
      }),
    )
    expect(node).toBe(tree)
    expect(node).toBe('string[]')
  })

  it('array of number', () => {
    const tree = fromTree({
      keyword: schemaKeywords.array,
      args: { items: [{ keyword: schemaKeywords.number }] },
    })
    const node = fromNode(
      createSchema({
        type: 'array',
        items: [createSchema({ type: 'number' })],
      }),
    )
    expect(node).toBe(tree)
    expect(node).toBe('number[]')
  })

  it('array of ref', () => {
    const tree = fromTree({
      keyword: schemaKeywords.array,
      args: { items: [{ keyword: schemaKeywords.ref, args: { name: 'Pet', $ref: '', path: '' as any, isImportable: true } }] },
    })
    const node = fromNode(
      createSchema({
        type: 'array',
        items: [createSchema({ type: 'ref', name: 'Pet' })],
      }),
    )
    expect(node).toBe(tree)
    expect(node).toBe('Pet[]')
  })
})

// ─── tuple ────────────────────────────────────────────────────────────────────

describe('parseSchemaNode parity — tuple', () => {
  it('tuple of string, number, boolean', () => {
    const tree = fromTree({
      keyword: schemaKeywords.tuple,
      args: {
        items: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }, { keyword: schemaKeywords.boolean }],
      },
    })
    const node = fromNode(
      createSchema({
        type: 'tuple',
        items: [createSchema({ type: 'string' }), createSchema({ type: 'number' }), createSchema({ type: 'boolean' })],
      }),
    )
    expect(node).toBe(tree)
    expect(node).toContain('[')
    expect(node).toContain('string')
    expect(node).toContain('number')
    expect(node).toContain('boolean')
  })
})
