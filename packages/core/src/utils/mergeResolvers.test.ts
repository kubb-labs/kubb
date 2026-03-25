import { describe, expect, it } from 'vitest'
import { defineResolver } from '../defineResolver.ts'
import type { Builder, Resolver } from '../types.ts'
import { mergeResolvers } from './mergeResolvers.ts'

type TestResolver = Resolver & {
  greet(name: string): string
  goodbye(name: string): string
}

type TestPluginFactory = {
  name: 'test'
  options: {}
  resolvedOptions: {}
  context: never
  resolvePathOptions: object
  resolver: TestResolver
  builder: Builder
}

describe('mergeResolvers', () => {
  const base = defineResolver<TestPluginFactory>(() => ({
    pluginName: 'test',
    name: 'base',
    greet(name) {
      return `Hi ${name}`
    },
    goodbye(name) {
      return `Bye ${name}`
    },
  }))

  it('single resolver returns itself', () => {
    const merged = mergeResolvers(base)

    expect(merged.name).toBe('base')
    expect(merged.greet('Alice')).toBe('Hi Alice')
  })

  it('later resolver overrides earlier methods', () => {
    const override = defineResolver<TestPluginFactory>(() => ({
      ...base,
      pluginName: 'test',
      name: 'override',
      greet(name) {
        return `Hey ${name}!`
      },
    }))

    const merged = mergeResolvers(base, override)

    expect(merged.name).toBe('override')
    expect(merged.greet('Bob')).toBe('Hey Bob!')
    expect(merged.goodbye('Bob')).toBe('Bye Bob')
  })

  it('three resolvers — last wins for conflicting methods', () => {
    const a = defineResolver<TestPluginFactory>(() => ({
      ...base,
      pluginName: 'test',
      name: 'a',
      greet() {
        return 'A'
      },
    }))
    const b = defineResolver<TestPluginFactory>(() => ({
      ...base,
      pluginName: 'test',
      name: 'b',
      greet() {
        return 'B'
      },
    }))

    const merged = mergeResolvers(base, a, b)

    expect(merged.greet('')).toBe('B')
    expect(merged.name).toBe('b')
  })

  it('last resolver wins entirely — earlier overrides are replaced', () => {
    const withGreet = defineResolver<TestPluginFactory>(() => ({
      ...base,
      pluginName: 'test',
      name: 'greeter',
      greet() {
        return 'custom greet'
      },
    }))
    const withGoodBye = defineResolver<TestPluginFactory>(() => ({
      ...base,
      pluginName: 'test',
      name: 'goodbye',
      goodbye() {
        return 'custom goodbye'
      },
    }))

    const merged = mergeResolvers(withGreet, withGoodBye)

    expect(merged.greet('')).toBe('Hi ')
    expect(merged.goodbye('')).toBe('custom goodbye')
    expect(merged.name).toBe('goodbye')
  })
})
