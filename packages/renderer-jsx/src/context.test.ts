import { inject, provide, unprovide } from '@internals/utils'
import { describe, expect, it } from 'vitest'
import { KubbContext } from './context/KubbContext.ts'
import { OasContext } from './context/OasContext.ts'

describe('KubbContext', () => {
  it('should provide and inject a value', () => {
    const value = { driver: {}, plugin: {}, mode: 'split' as const }
    provide(KubbContext, value)
    expect(inject(KubbContext)).toBe(value)
    unprovide(KubbContext)
  })
})

describe('OasContext', () => {
  it('should provide and inject a value', () => {
    const oas = { openapi: '3.0.0', info: { title: 'Test', version: '1' }, paths: {} }
    provide(OasContext, oas)
    expect(inject(OasContext)).toBe(oas)
    unprovide(OasContext)
  })
})
