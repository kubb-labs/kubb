import { describe, expect, test } from 'vitest'
import { Resolver } from './Resolver.ts'

describe('resolver name reservations', () => {
  test('reuses an allocation for equivalent readonly array keys', () => {
    const resolver = new Resolver({ pluginName: 'types' })
    const key = ['operation', 'POST', '/containers', 'body'] as const
    resolver.reserveNames(['CreateContainerBody'])

    expect(resolver.resolveName({ key, name: 'CreateContainerBody' })).toBe('CreateContainerBody2')
    expect(resolver.resolveName({ key: [...key], name: 'CreateContainerBody' })).toBe('CreateContainerBody2')
  })

  test.each([
    { label: 'segment boundaries', first: ['operation', 'a:b', 'c'], second: ['operation', 'a', 'b:c'] },
    { label: 'segment order', first: ['operation', 'a', 'b'], second: ['operation', 'b', 'a'] },
    { label: 'optional segments', first: ['operation', undefined], second: ['operation', 'undefined'] },
    { label: 'missing versus empty segments', first: ['operation', undefined], second: ['operation', ''] },
    { label: 'string versus array', first: '["operation"]', second: ['operation'] },
  ])('distinguishes keys by $label', ({ first, second }) => {
    const resolver = new Resolver({ pluginName: 'types' })
    expect(resolver.resolveName({ key: first, name: 'Pet' })).toBe('Pet')
    expect(resolver.resolveName({ key: second, name: 'Pet' })).toBe('Pet2')
    expect(resolver.resolveName({ key: first, name: 'Pet' })).toBe('Pet')
  })

  test('skips occupied suffixes and returns the same name for repeated references', () => {
    const resolver = new Resolver({ pluginName: 'types' })
    resolver.reserveNames(['CreateContainerBody', 'CreateContainerBody2'])

    const declaration = { key: 'POST /containers:body', name: 'CreateContainerBody' }
    expect(resolver.resolveName(declaration)).toBe('CreateContainerBody3')
    expect(resolver.resolveName({ key: 'POST /other:body', name: declaration.name })).toBe('CreateContainerBody4')
    expect(resolver.resolveName(declaration)).toBe('CreateContainerBody3')
  })

  test('compares normalized identifiers without applying casing twice to the returned name', () => {
    const resolver = new Resolver({ pluginName: 'types' })
    const normalize = (name: string) => `Api${name.toLowerCase()}`
    resolver.reserveNames(['Apistatus', 'Apistatus2'])

    expect(resolver.resolveName({ key: 'first:enum', name: 'Status', normalize })).toBe('Status3')
    expect(resolver.resolveName({ key: 'second:enum', name: 'STATUS', normalize })).toBe('STATUS4')
    expect(resolver.resolveName({ key: 'first:enum', name: 'Status', normalize })).toBe('Status3')
  })

  test('normalizes each candidate once', () => {
    const resolver = new Resolver({ pluginName: 'types' })
    const seen: Array<string> = []
    const normalize = (name: string) => {
      seen.push(name)
      return name.toLowerCase()
    }
    resolver.reserveNames(['status'])

    expect(resolver.resolveName({ key: 'enum', name: 'Status', normalize })).toBe('Status2')
    expect(seen).toEqual(['Status', 'Status2'])
  })

  test('takes a name only when every identifier it emits is free', () => {
    const resolver = new Resolver({ pluginName: 'types' })
    const normalize = (name: string) => [name.toLowerCase(), `${name}Key`]
    resolver.reserveNames(['status', 'Status2Key'])

    expect(resolver.resolveName({ key: 'first:enum', name: 'Status', normalize })).toBe('Status3')
    expect(resolver.resolveName({ key: 'second:enum', name: 'Status', normalize })).toBe('Status4')
    expect(resolver.resolveName({ key: 'later', name: 'status3' })).toBe('status32')
  })

  test('keeps allocations isolated between resolvers and merges', () => {
    const base = new Resolver({ pluginName: 'types' })
    base.reserveNames(['Pet'])
    expect(base.resolveName({ key: 'operation', name: 'Pet' })).toBe('Pet2')

    const first = Resolver.merge(base)
    const second = Resolver.merge(base)
    expect(first.resolveName({ key: 'operation', name: 'Pet' })).toBe('Pet')
    first.reserveNames(['Store'])
    expect(second.resolveName({ key: 'operation', name: 'Store' })).toBe('Store')
    expect(base.resolveName({ key: 'operation', name: 'Pet' })).toBe('Pet2')
  })
})
