import { describe, expect, test } from 'vitest'
import type { UserLogger } from './types.ts'
import { defineLogger } from './defineLogger.ts'

describe('defineLogger', () => {
  test('should define a logger with all methods', () => {
    const userLogger: UserLogger = {
      on: () => {},
      emit: () => {},
      logLevel: 'info',
    }

    const logger = defineLogger(userLogger)

    expect(logger).toBeDefined()
    expect(logger.on).toBe(userLogger.on)
    expect(logger.emit).toBe(userLogger.emit)
    expect(logger.logLevel).toBe(userLogger.logLevel)
  })

  test('should preserve custom logger properties', () => {
    const customLogger: UserLogger<{ customProp: string }> = {
      on: () => {},
      emit: () => {},
      logLevel: 'debug',
      customProp: 'test',
    }

    const logger = defineLogger(customLogger)

    expect(logger.customProp).toBe('test')
  })
})
