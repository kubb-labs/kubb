import { describe, expect, it } from 'vitest'
import { defineResolver } from './defineResolver.ts'
import type { Resolver } from './types.ts'

type TestResolver = Resolver & {
  greet(name: string): string
  farewell(name: string): string
}

type TestPluginFactory = {
  name: 'test'
  options: {}
  resolvedOptions: {}
  context: never
  resolvePathOptions: object
  resolver: TestResolver
}

describe('defineResolver', () => {
  it('injects default and resolveOptions', () => {
    const resolver = defineResolver<TestPluginFactory>(() => ({
      name: 'test',
      greet(name) {
        return `Hello ${name}`
      },
      farewell(name) {
        return `Goodbye ${name}`
      },
    }))

    expect(resolver.default).toBeTypeOf('function')
    expect(resolver.resolveOptions).toBeTypeOf('function')
    expect(resolver.name).toBe('test')
  })

  it('build function values override defaults', () => {
    const resolver = defineResolver<TestPluginFactory>(() => ({
      name: 'custom',
      default(name) {
        return name.toUpperCase()
      },
      greet(name) {
        return this.default(name)
      },
      farewell(name) {
        return `bye ${this.default(name)}`
      },
    }))

    expect(resolver.default('hello')).toBe('HELLO')
    expect(resolver.greet('world')).toBe('WORLD')
  })
})
