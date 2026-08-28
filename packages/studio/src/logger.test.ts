import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spyOnConsole } from './console.mock.ts'
import { logger, setLogLevel } from './logger.ts'

const consoleSpy = spyOnConsole()

beforeEach(() => {
  Object.values(consoleSpy).forEach((spy) => spy.mockClear())
})

afterEach(() => {
  setLogLevel('info')
})

describe('log level', () => {
  it('keeps progress and warnings at the default', () => {
    setLogLevel()

    logger.info('agent', 'connecting')
    logger.warn('agent', 'input ignored')

    expect(consoleSpy.info).toHaveBeenCalledOnce()
    expect(consoleSpy.warn).toHaveBeenCalledOnce()
  })

  it('holds protocol chatter back until verbose', () => {
    setLogLevel('info')
    logger.debug('agent', 'received pong')

    expect(consoleSpy.debug).not.toHaveBeenCalled()

    setLogLevel('verbose')
    logger.debug('agent', 'received pong')

    expect(consoleSpy.debug).toHaveBeenCalledOnce()
  })

  it('drops progress and warnings at silent', () => {
    setLogLevel('silent')

    logger.info('agent', 'connecting')
    logger.success('agent', 'connected')
    logger.warn('agent', 'input ignored')

    expect(consoleSpy.info).not.toHaveBeenCalled()
    expect(consoleSpy.log).not.toHaveBeenCalled()
    expect(consoleSpy.warn).not.toHaveBeenCalled()
  })

  // Silent means quiet, not blind: a failure the operator cannot predict from their own flags
  // still has to reach them.
  it('still reports failures at silent', () => {
    setLogLevel('silent')

    logger.error('agent', 'could not reach Kubb Studio')
    logger.exception('agent', new Error('boom'))

    expect(consoleSpy.error).toHaveBeenCalledTimes(2)
  })
})
