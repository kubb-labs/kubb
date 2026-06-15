import { describe, expect, it } from 'vitest'
import { createInput } from '../nodes/input.ts'
import { createOperation } from '../nodes/operation.ts'
import { createProperty } from '../nodes/property.ts'
import { createSchema } from '../nodes/schema.ts'
import { transform } from '../visitor.ts'
import { applyMacros, composeMacros, defineMacro } from './defineMacro.ts'

describe('defineMacro', () => {
  it('returns the macro unchanged', () => {
    const macro = defineMacro({ name: 'noop' })
    expect(macro.name).toBe('noop')
  })
})

describe('composeMacros', () => {
  it('chains macros so a later macro sees the earlier output', () => {
    const root = createSchema({ name: 'Pet', type: 'object', properties: [] })

    const macroA = defineMacro({
      name: 'set-title',
      schema: (node) => ({ ...node, title: 'a' }),
    })
    const macroB = defineMacro({
      name: 'read-title',
      schema: (node) => (node.title === 'a' ? { ...node, description: 'saw-a' } : undefined),
    })

    const next = transform(root, composeMacros([macroA, macroB]))
    expect(next.title).toBe('a')
    expect(next.description).toBe('saw-a')
  })

  it('orders pre before unmarked before post regardless of list order', () => {
    const order: Array<string> = []
    const root = createSchema({ type: 'string' })

    const post = defineMacro({
      name: 'post',
      enforce: 'post',
      schema: () => {
        order.push('post')
        return undefined
      },
    })
    const plain = defineMacro({
      name: 'plain',
      schema: () => {
        order.push('plain')
        return undefined
      },
    })
    const pre = defineMacro({
      name: 'pre',
      enforce: 'pre',
      schema: () => {
        order.push('pre')
        return undefined
      },
    })

    transform(root, composeMacros([post, plain, pre]))
    expect(order).toEqual(['pre', 'plain', 'post'])
  })

  it('skips a macro when its `when` gate returns false', () => {
    const root = createSchema({ type: 'integer' })

    const macro = defineMacro({
      name: 'only-string',
      when: (node) => 'type' in node && node.type === 'string',
      schema: (node) => ({ ...node, description: 'touched' }),
    })

    const next = transform(root, composeMacros([macro]))
    expect(next.description).toBeUndefined()
    expect(next).toBe(root)
  })
})

describe('applyMacros', () => {
  it('returns the same reference for an empty macro list', () => {
    const root = createSchema({ type: 'string' })
    expect(applyMacros(root, [])).toBe(root)
  })

  it('returns the same reference when no macro changes anything (structural sharing)', () => {
    const root = createSchema({ type: 'object', properties: [createProperty({ name: 'id', schema: createSchema({ type: 'string' }) })] })

    const noop = defineMacro({ name: 'noop', schema: () => undefined })
    expect(applyMacros(root, [noop])).toBe(root)
  })

  it('rewrites matching schema nodes deep in the tree', () => {
    const root = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'count', schema: createSchema({ type: 'integer' }) })],
    })

    const macroIntegerToString = defineMacro({
      name: 'integer-to-string',
      schema: (node) => (node.type === 'integer' ? { ...node, type: 'string' } : undefined),
    })

    const next = applyMacros(root, [macroIntegerToString])
    expect(next).not.toBe(root)
    const prop = 'properties' in next ? next.properties[0] : undefined
    expect(prop?.schema.type).toBe('string')
  })

  it('runs over a non-HTTP operation without touching method or path', () => {
    const operation = createOperation({ operationId: 'onMessage' })
    const root = createInput({ schemas: [], operations: [operation] })

    const macroTagged = defineMacro({
      name: 'tagged',
      operation: (node) => (node.tags?.length ? undefined : { ...node, tags: ['events'] }),
    })

    const next = applyMacros(root, [macroTagged])
    const tagged = next.operations[0]
    if (!tagged) throw new Error('expected an operation')
    expect(tagged.tags).toEqual(['events'])
    expect(tagged.protocol).not.toBe('http')
    expect('method' in tagged ? tagged.method : undefined).toBeUndefined()
  })
})
