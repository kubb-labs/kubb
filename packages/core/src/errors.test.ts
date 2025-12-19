import { describe, expect, test } from 'vitest'
import { ValidationPluginError } from './errors.ts'

describe('ValidationPluginError', () => {
  test('should create an error instance', () => {
    const error = new ValidationPluginError('Test error message')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ValidationPluginError)
  })

  test('should preserve error message', () => {
    const message = 'Custom validation error'
    const error = new ValidationPluginError(message)
    expect(error.message).toBe(message)
  })

  test('should have correct name', () => {
    const error = new ValidationPluginError('Test')
    expect(error.name).toBe('Error')
  })
})
