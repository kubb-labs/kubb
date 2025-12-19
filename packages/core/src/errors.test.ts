import { ValidationPluginError } from './errors.ts'
import { describe, expect, it } from 'vitest'


describe('ValidationPluginError', () => {
  it('should create an error instance', () => {
    const error = new ValidationPluginError('Test error message')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ValidationPluginError)
  })

  it('should preserve error message', () => {
    const message = 'Custom validation error'
    const error = new ValidationPluginError(message)
    expect(error.message).toBe(message)
  })

  it('should have correct name', () => {
    const error = new ValidationPluginError('Test')
    expect(error.name).toBe('Error')
  })
})
