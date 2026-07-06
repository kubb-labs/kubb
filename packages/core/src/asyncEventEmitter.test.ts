import { describe, expect, it, vi } from 'vitest'
import { AsyncEventEmitter } from './asyncEventEmitter.ts'

type TestEvents = {
  test: [string, number]
  error: [Error]
  noArgs: []
  single: [string]
}

describe('AsyncEventEmitter', () => {
  it('should emit event to registered listeners', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler = vi.fn()

    emitter.on('test', handler)
    await emitter.emit('test', 'hello', 42)

    expect(handler).toHaveBeenCalledWith('hello', 42)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should emit event to multiple listeners', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('test', handler1)
    emitter.on('test', handler2)
    await emitter.emit('test', 'hello', 42)

    expect(handler1).toHaveBeenCalledWith('hello', 42)
    expect(handler2).toHaveBeenCalledWith('hello', 42)
  })

  it('should handle async listeners', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler = vi.fn().mockResolvedValue(undefined)

    emitter.on('test', handler)
    await emitter.emit('test', 'hello', 42)

    expect(handler).toHaveBeenCalled()
  })

  it('should return undefined when emitting event with no registered listeners', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const result = await emitter.emit('test', 'hello', 42)

    expect(result).toBeUndefined()
  })

  it('should wrap a rejecting listener with the event name and serialized arguments', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const cause = new Error('listener failed')

    emitter.on('test', () => {
      throw cause
    })

    await expect(emitter.emit('test', 'hello', 42)).rejects.toThrow('Error in async listener for "test" with eventArgs ["hello",42]')
    await expect(emitter.emit('test', 'hello', 42)).rejects.toMatchObject({ cause })
  })

  it('should stop calling later listeners once one rejects', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const second = vi.fn()

    emitter.on('test', () => {
      throw new Error('boom')
    })
    emitter.on('test', second)

    await expect(emitter.emit('test', 'hello', 42)).rejects.toThrow()
    expect(second).not.toHaveBeenCalled()
  })

  it('should remove listener with off method', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler = vi.fn()

    emitter.on('test', handler)
    emitter.off('test', handler)
    await emitter.emit('test', 'hello', 42)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should remove all listeners', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('test', handler1)
    emitter.on('single', handler2)
    emitter.removeAll()
    await emitter.emit('test', 'hello', 42)
    await emitter.emit('single', 'world')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should handle events with no arguments', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler = vi.fn()

    emitter.on('noArgs', handler)
    await emitter.emit('noArgs')

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
