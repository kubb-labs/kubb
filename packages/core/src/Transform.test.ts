import { factory } from '@kubb/ast'
import type { SchemaNode, Visitor } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { Transform } from './Transform.ts'

function namedSchema(name: string): SchemaNode {
  return factory.createSchema({ type: 'string', name })
}

describe('Transform — applyTo', () => {
  it('returns the original node reference when no transformer is registered', () => {
    const transforms = new Transform()
    const node = namedSchema('Pet')

    const result = transforms.applyTo('@kubb/plugin-ts', node)

    expect(result).toBe(node)
  })

  it('runs the registered visitor and returns its replacement', () => {
    const transforms = new Transform()
    const visitor: Visitor = {
      schema: (node) => (node.name === 'Pet' ? { ...node, name: 'PetRenamed' } : undefined),
    }
    transforms.register('@kubb/plugin-ts', visitor)

    const result = transforms.applyTo('@kubb/plugin-ts', namedSchema('Pet'))

    expect(result.name).toBe('PetRenamed')
  })

  it('keeps plugins isolated so plugin A does not see plugin B output', () => {
    const transforms = new Transform()
    transforms.register('a', { schema: (node) => ({ ...node, name: `${node.name}-A` }) })
    transforms.register('b', { schema: (node) => ({ ...node, name: `${node.name}-B` }) })

    const source = namedSchema('Pet')
    const fromA = transforms.applyTo('a', source)
    const fromB = transforms.applyTo('b', source)

    expect(fromA.name).toBe('Pet-A')
    expect(fromB.name).toBe('Pet-B')
  })

  it('returns the original node when the registered visitor leaves it untouched', () => {
    const transforms = new Transform()
    transforms.register('noop', { schema: () => undefined })

    const node = namedSchema('Pet')
    const result = transforms.applyTo('noop', node)

    expect(result).toBe(node)
  })
})

describe('Transform — memoization', () => {
  it('returns the identical transformed reference for repeated applyTo calls', () => {
    const transforms = new Transform()
    transforms.register('a', { schema: (node) => (node.name === 'Pet' ? { ...node, name: 'PetRenamed' } : undefined) })

    const node = namedSchema('Pet')
    const first = transforms.applyTo('a', node)
    const second = transforms.applyTo('a', node)

    expect(first.name).toBe('PetRenamed')
    expect(second).toBe(first)
  })

  it('runs the visitor once per node even when applied twice', () => {
    const transforms = new Transform()
    let calls = 0
    transforms.register('a', {
      schema: (node) => {
        calls++
        return node.name === 'Pet' ? { ...node, name: 'PetRenamed' } : undefined
      },
    })

    const node = namedSchema('Pet')
    transforms.applyTo('a', node)
    const callsAfterFirst = calls
    transforms.applyTo('a', node)

    expect(calls).toBe(callsAfterFirst)
  })

  it('invalidates memoized results when a new visitor is registered for the plugin', () => {
    const transforms = new Transform()
    const node = namedSchema('Pet')
    transforms.register('a', { schema: (n) => ({ ...n, name: 'first' }) })

    expect(transforms.applyTo('a', node).name).toBe('first')

    transforms.register('a', { schema: (n) => ({ ...n, name: 'second' }) })

    expect(transforms.applyTo('a', node).name).toBe('second')
  })

  it('dispose clears memoized results along with the registry', () => {
    const transforms = new Transform()
    const node = namedSchema('Pet')
    transforms.register('a', { schema: (n) => ({ ...n, name: 'changed' }) })
    const before = transforms.applyTo('a', node)

    transforms.dispose()
    transforms.register('a', { schema: (n) => ({ ...n, name: 'changed' }) })
    const after = transforms.applyTo('a', node)

    expect(after.name).toBe('changed')
    expect(after).not.toBe(before)
  })
})

describe('Transform — registry', () => {
  it('tracks size and exposes get', () => {
    const transforms = new Transform()
    const visitor: Visitor = { schema: () => undefined }

    expect(transforms.size).toBe(0)
    expect(transforms.get('a')).toBeUndefined()

    transforms.register('a', visitor)

    expect(transforms.size).toBe(1)
    expect(transforms.get('a')).toBe(visitor)
  })

  it('overwrites a previous registration for the same plugin', () => {
    const transforms = new Transform()
    const first: Visitor = { schema: (node) => ({ ...node, name: 'first' }) }
    const second: Visitor = { schema: (node) => ({ ...node, name: 'second' }) }

    transforms.register('a', first)
    transforms.register('a', second)

    expect(transforms.size).toBe(1)
    expect(transforms.applyTo('a', namedSchema('original')).name).toBe('second')
  })

  it('dispose clears the registry', () => {
    const transforms = new Transform()
    transforms.register('a', { schema: (node) => ({ ...node, name: 'changed' }) })

    transforms.dispose()

    expect(transforms.size).toBe(0)
    expect(transforms.get('a')).toBeUndefined()
    expect(transforms.applyTo('a', namedSchema('Pet')).name).toBe('Pet')
  })
})
