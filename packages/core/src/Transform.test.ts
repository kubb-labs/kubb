import { ast, type SchemaNode, type Visitor } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { Transform } from './Transform.ts'

function namedSchema(name: string): SchemaNode {
  return ast.factory.createSchema({ type: 'string', name })
}

describe('Transform — applyTo', () => {
  it('returns the original node reference when no macros are registered', () => {
    const transforms = new Transform()
    const node = namedSchema('Pet')

    const result = transforms.applyTo('@kubb/plugin-ts', node)

    expect(result).toBe(node)
  })

  it('runs the registered macro and returns its replacement', () => {
    const transforms = new Transform()
    const visitor: Visitor = {
      schema: (node) => (node.name === 'Pet' ? { ...node, name: 'PetRenamed' } : undefined),
    }
    transforms.set('@kubb/plugin-ts', [{ name: 'rename', ...visitor }])

    const result = transforms.applyTo('@kubb/plugin-ts', namedSchema('Pet'))

    expect(result.name).toBe('PetRenamed')
  })

  it('keeps plugins isolated so plugin A does not see plugin B output', () => {
    const transforms = new Transform()
    transforms.set('a', [{ name: 'a', schema: (node) => ({ ...node, name: `${node.name}-A` }) }])
    transforms.set('b', [{ name: 'b', schema: (node) => ({ ...node, name: `${node.name}-B` }) }])

    const source = namedSchema('Pet')
    const fromA = transforms.applyTo('a', source)
    const fromB = transforms.applyTo('b', source)

    expect(fromA.name).toBe('Pet-A')
    expect(fromB.name).toBe('Pet-B')
  })

  it('returns the original node when the registered macro leaves it untouched', () => {
    const transforms = new Transform()
    transforms.set('noop', [{ name: 'noop', schema: () => undefined }])

    const node = namedSchema('Pet')
    const result = transforms.applyTo('noop', node)

    expect(result).toBe(node)
  })
})

describe('Transform — memoization', () => {
  it('returns the identical transformed reference for repeated applyTo calls', () => {
    const transforms = new Transform()
    transforms.set('a', [{ name: 'a', schema: (node) => (node.name === 'Pet' ? { ...node, name: 'PetRenamed' } : undefined) }])

    const node = namedSchema('Pet')
    const first = transforms.applyTo('a', node)
    const second = transforms.applyTo('a', node)

    expect(first.name).toBe('PetRenamed')
    expect(second).toBe(first)
  })

  it('runs the macro once per node even when applied twice', () => {
    const transforms = new Transform()
    let calls = 0
    transforms.set('a', [
      {
        name: 'a',
        schema: (node) => {
          calls++
          return node.name === 'Pet' ? { ...node, name: 'PetRenamed' } : undefined
        },
      },
    ])

    const node = namedSchema('Pet')
    transforms.applyTo('a', node)
    const callsAfterFirst = calls
    transforms.applyTo('a', node)

    expect(calls).toBe(callsAfterFirst)
  })

  it('invalidates memoized results when a new macro list is set for the plugin', () => {
    const transforms = new Transform()
    const node = namedSchema('Pet')
    transforms.set('a', [{ name: 'a', schema: (n) => ({ ...n, name: 'first' }) }])

    expect(transforms.applyTo('a', node).name).toBe('first')

    transforms.set('a', [{ name: 'a', schema: (n) => ({ ...n, name: 'second' }) }])

    expect(transforms.applyTo('a', node).name).toBe('second')
  })

  it('dispose clears memoized results along with the registry', () => {
    const transforms = new Transform()
    const node = namedSchema('Pet')
    transforms.set('a', [{ name: 'a', schema: (n) => ({ ...n, name: 'changed' }) }])
    const before = transforms.applyTo('a', node)

    transforms.dispose()
    transforms.set('a', [{ name: 'a', schema: (n) => ({ ...n, name: 'changed' }) }])
    const after = transforms.applyTo('a', node)

    expect(after.name).toBe('changed')
    expect(after).not.toBe(before)
  })
})

describe('Transform — registry', () => {
  it('tracks size and exposes get', () => {
    const transforms = new Transform()

    expect(transforms.size).toBe(0)
    expect(transforms.get('a')).toBeUndefined()

    transforms.set('a', [{ name: 'a', schema: () => undefined }])

    expect(transforms.size).toBe(1)
    expect(transforms.get('a')).toBeDefined()
  })

  it('overwrites a previous macro list for the same plugin', () => {
    const transforms = new Transform()

    transforms.set('a', [{ name: 'first', schema: (node) => ({ ...node, name: 'first' }) }])
    transforms.set('a', [{ name: 'second', schema: (node) => ({ ...node, name: 'second' }) }])

    expect(transforms.size).toBe(1)
    expect(transforms.applyTo('a', namedSchema('original')).name).toBe('second')
  })

  it('dispose clears the registry', () => {
    const transforms = new Transform()
    transforms.set('a', [{ name: 'a', schema: (node) => ({ ...node, name: 'changed' }) }])

    transforms.dispose()

    expect(transforms.size).toBe(0)
    expect(transforms.get('a')).toBeUndefined()
    expect(transforms.applyTo('a', namedSchema('Pet')).name).toBe('Pet')
  })
})

describe('Transform — macros', () => {
  it('runs added macros in order so a later macro sees the earlier output', () => {
    const transforms = new Transform()
    transforms.add('a', { name: 'first', schema: (node) => ({ ...node, name: `${node.name}-1` }) })
    transforms.add('a', { name: 'second', schema: (node) => ({ ...node, name: `${node.name}-2` }) })

    expect(transforms.applyTo('a', namedSchema('Pet')).name).toBe('Pet-1-2')
  })

  it('set replaces the whole macro list', () => {
    const transforms = new Transform()
    transforms.add('a', { name: 'first', schema: (node) => ({ ...node, name: 'first' }) })
    transforms.set('a', [{ name: 'only', schema: (node) => ({ ...node, name: 'only' }) }])

    expect(transforms.applyTo('a', namedSchema('Pet')).name).toBe('only')
  })

  it('orders macros within a plugin by enforce', () => {
    const transforms = new Transform()
    transforms.add('a', { name: 'post', enforce: 'post', schema: (node) => ({ ...node, name: `${node.name}-post` }) })
    transforms.add('a', { name: 'pre', enforce: 'pre', schema: (node) => ({ ...node, name: `${node.name}-pre` }) })

    expect(transforms.applyTo('a', namedSchema('Pet')).name).toBe('Pet-pre-post')
  })
})
