import { describe, expect, expectTypeOf, it } from 'vitest'
import { defineGenerator, defineReactGenerator } from './defineGenerator.ts'
import type { Generator, ReactGenerator } from './defineGenerator.ts'
import type { PluginFactoryOptions } from './types.ts'

// ---------------------------------------------------------------------------
// Minimal plugin factory options used across tests
// ---------------------------------------------------------------------------
type MockPluginOptions = {
  enumType?: 'asConst' | 'enum'
  generators?: Array<Generator<MockPlugin>>
}

type MockPlugin = PluginFactoryOptions<'mock-plugin', MockPluginOptions, MockPluginOptions>

// Minimal element type to simulate e.g. KubbReactElement from @kubb/renderer-jsx
type FakeReactElement = { $$typeof: symbol; type: unknown; props: unknown }

// ---------------------------------------------------------------------------
// defineGenerator
// ---------------------------------------------------------------------------

describe('defineGenerator', () => {
  it('returns the generator object unchanged', () => {
    const gen = defineGenerator<MockPlugin>({
      name: 'test-gen',
      schema(_node, _ctx) {
        return []
      },
    })
    expect(gen.name).toBe('test-gen')
    expect(typeof gen.schema).toBe('function')
  })

  it('infers return type as Generator<TOptions, TElement>', () => {
    const gen = defineGenerator<MockPlugin>({ name: 'simple' })
    expectTypeOf(gen).toMatchTypeOf<Generator<MockPlugin>>()
  })
})

// ---------------------------------------------------------------------------
// defineReactGenerator
// ---------------------------------------------------------------------------

describe('defineReactGenerator', () => {
  it('returns the generator object unchanged', () => {
    const renderer = () => ({
      async render(_el: FakeReactElement) {},
      unmount() {},
      get files() {
        return []
      },
    })

    const gen = defineReactGenerator<MockPlugin, FakeReactElement>({
      name: 'react-gen',
      renderer,
      schema(_node, _ctx) {
        return undefined as unknown as FakeReactElement
      },
    })

    expect(gen.name).toBe('react-gen')
    expect(gen.renderer).toBe(renderer)
  })

  it('infers return type as ReactGenerator<TOptions, TElement>', () => {
    const renderer = () => ({
      async render(_el: FakeReactElement) {},
      unmount() {},
      get files() {
        return []
      },
    })

    const gen = defineReactGenerator<MockPlugin, FakeReactElement>({
      name: 'react-gen',
      renderer,
    })

    expectTypeOf(gen).toMatchTypeOf<ReactGenerator<MockPlugin, FakeReactElement>>()
  })
})

// ---------------------------------------------------------------------------
// Type-level assignability tests
//
// These ensure that Generator and ReactGenerator are assignable to the wider
// Array<Generator<TOptions>> as used in plugin `generators` options.
// This is the core of the bug reported in:
//   https://github.com/kubb-labs/kubb/issues/XXXX
// ---------------------------------------------------------------------------

describe('Generator assignability', () => {
  it('Generator<TOptions, FakeReactElement> is assignable to Generator<TOptions>', () => {
    const renderer = () => ({
      async render(_el: FakeReactElement) {},
      unmount() {},
      get files() {
        return []
      },
    })

    // Simulates typeGenerator from @kubb/plugin-ts/generators which returns JSX
    const typeGenerator = defineGenerator<MockPlugin, FakeReactElement>({
      name: 'type',
      renderer,
      schema(_node, _ctx) {
        return undefined as unknown as FakeReactElement
      },
    })

    // Simulates a custom generator that returns FileNode[] instead of JSX
    const customGenerator = defineGenerator<MockPlugin>({
      name: 'custom',
      schema(_node, _ctx) {
        return []
      },
    })

    // The crucial test: both should be valid in the generators array
    const generators: Array<Generator<MockPlugin>> = [typeGenerator, customGenerator]
    expect(generators).toHaveLength(2)
  })

  it('ReactGenerator<TOptions, TElement> is assignable to Generator<TOptions>', () => {
    const renderer = () => ({
      async render(_el: FakeReactElement) {},
      unmount() {},
      get files() {
        return []
      },
    })

    const reactGen = defineReactGenerator<MockPlugin, FakeReactElement>({
      name: 'react-gen',
      renderer,
    })

    // ReactGenerator must be assignable to the base Generator type
    const generators: Array<Generator<MockPlugin>> = [reactGen]
    expect(generators).toHaveLength(1)
  })

  it('mixing ReactGenerator and plain Generator in the same array is type-safe', () => {
    const renderer = () => ({
      async render(_el: FakeReactElement) {},
      unmount() {},
      get files() {
        return []
      },
    })

    const reactGen = defineReactGenerator<MockPlugin, FakeReactElement>({
      name: 'react-gen',
      renderer,
    })

    const plainGen = defineGenerator<MockPlugin>({
      name: 'plain-gen',
      schema(_node, _ctx) {
        return []
      },
    })

    const generators: Array<Generator<MockPlugin>> = [reactGen, plainGen]
    expect(generators).toHaveLength(2)
  })
})
