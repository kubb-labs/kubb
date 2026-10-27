import { describe, expect, test } from 'vitest'
import { Resolver } from './Resolver.ts'

describe('resolver name reservations', () => {
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
