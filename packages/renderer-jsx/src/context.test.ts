import { inject, provide, unprovide } from '@internals/utils'
import { describe, expect, it } from 'vitest'
import { KubbContext } from './context/KubbContext.ts'
import { OasContext } from './context/OasContext.ts'

describe('KubbContext', () => {
  it('should be a symbol context key', () => {
    expect(typeof KubbContext).toBe('symbol')
  })

  it('should provide and inject a KubbContext value', () => {
    const value = { driver: {}, plugin: {}, mode: 'split' as const }
    provide(KubbContext, value)
    const injected = inject(KubbContext)
    expect(injected).toBe(value)
    unprovide(KubbContext)
  })

  it('should return null as default when nothing is provided', () => {
    // inject without providing should return the default (null)
    const injected = inject(KubbContext, null)
    expect(injected).toBeNull()
  })

  it('should stack and unstack values with provide/unprovide', () => {
    const first = { driver: {}, plugin: {}, mode: 'single' as const }
    const second = { driver: {}, plugin: {}, mode: 'split' as const }
    provide(KubbContext, first)
    provide(KubbContext, second)
    expect(inject(KubbContext)).toBe(second)
    unprovide(KubbContext)
    expect(inject(KubbContext)).toBe(first)
    unprovide(KubbContext)
  })
})

describe('OasContext', () => {
  it('should be a symbol context key', () => {
    expect(typeof OasContext).toBe('symbol')
  })

  it('should provide and inject an OasContext value', () => {
    const oas = { openapi: '3.0.0', info: { title: 'Test', version: '1' }, paths: {} }
    provide(OasContext, oas)
    const injected = inject(OasContext)
    expect(injected).toBe(oas)
    unprovide(OasContext)
  })

  it('should return null as default when nothing is provided', () => {
    const injected = inject(OasContext, null)
    expect(injected).toBeNull()
  })

  it('should stack and unstack values with provide/unprovide', () => {
    const first = { version: 'v1' }
    const second = { version: 'v2' }
    provide(OasContext, first)
    provide(OasContext, second)
    expect(inject(OasContext)).toBe(second)
    unprovide(OasContext)
    expect(inject(OasContext)).toBe(first)
    unprovide(OasContext)
  })
})
