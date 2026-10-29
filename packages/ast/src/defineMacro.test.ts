import { describe, expect, it } from 'vitest'
import { createProperty } from './nodes/property.ts'
import { createSchema } from './nodes/schema.ts'
import { applyMacros, defineMacro } from './defineMacro.ts'

describe('applyMacros', () => {
  it('chains macros so a later macro sees the earlier output', () => {
    const root = createSchema({ name: 'Pet', type: 'object', properties: [] })
    const setTitle = defineMacro({ name: 'set-title', schema: (node) => ({ ...node, title: 'a' }) })
    const readTitle = defineMacro({ name: 'read-title', schema: (node) => (node.title === 'a' ? { ...node, description: 'saw-a' } : undefined) })

    const next = applyMacros(root, [setTitle, readTitle])

    expect(next.description).toBe('saw-a')
  })

  it('orders pre before unmarked before post regardless of list order', () => {
    const order: Array<string> = []
    const track = (name: 'pre' | 'plain' | 'post', enforce?: 'pre' | 'post') =>
      defineMacro({
        name,
        enforce,
        schema: () => {
          order.push(name)
          return undefined
        },
      })

    applyMacros(createSchema({ type: 'string' }), [track('post', 'post'), track('plain'), track('pre', 'pre')])

    expect(order).toEqual(['pre', 'plain', 'post'])
  })

  it('skips a macro when its `match` predicate returns false', () => {
    const root = createSchema({ type: 'integer' })
    const macro = defineMacro({
      name: 'only-string',
      match: (node) => 'type' in node && node.type === 'string',
      schema: (node) => ({ ...node, description: 'touched' }),
    })

    expect(applyMacros(root, [macro])).toBe(root)
  })

  it('keeps the same reference when no macro changes anything', () => {
    const root = createSchema({ type: 'object', properties: [createProperty({ name: 'id', schema: createSchema({ type: 'string' }) })] })

    expect(applyMacros(root, [defineMacro({ name: 'noop', schema: () => undefined })])).toBe(root)
  })

  it('rewrites matching schema nodes deep in the tree', () => {
    const root = createSchema({ type: 'object', properties: [createProperty({ name: 'count', schema: createSchema({ type: 'integer' }) })] })
    const macro = defineMacro({ name: 'integer-to-string', schema: (node) => (node.type === 'integer' ? { ...node, type: 'string' } : undefined) })

    const next = applyMacros(root, [macro])
    const prop = 'properties' in next ? next.properties[0] : undefined

    expect(prop?.schema.type).toBe('string')
  })

  it('rewrites the root node only when depth is shallow', () => {
    const root = createSchema({ type: 'object', properties: [createProperty({ name: 'count', schema: createSchema({ type: 'integer' }) })] })
    const macro = defineMacro({ name: 'describe', schema: (node) => ({ ...node, description: 'touched' }) })

    const next = applyMacros(root, [macro], { depth: 'shallow' })
    const prop = 'properties' in next ? next.properties[0] : undefined

    expect(next.description).toBe('touched')
    expect(prop?.schema.description).toBeUndefined()
  })
})
