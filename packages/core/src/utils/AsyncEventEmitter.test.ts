
import { AsyncEventEmitter } from './AsyncEventEmitter.ts'

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

  it('should handle errors in listeners', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = vi.fn().mockRejectedValue(new Error('test error'))

    emitter.on('test', handler)
    await emitter.emit('test', 'hello', 42)

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should remove listener with off method', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler = vi.fn()

    emitter.on('test', handler)
    emitter.off('test', handler)
    await emitter.emit('test', 'hello', 42)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should execute onOnce listener only once', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler = vi.fn()

    emitter.onOnce('test', handler)
    await emitter.emit('test', 'hello', 42)
    await emitter.emit('test', 'world', 24)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('hello', 42)
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

  it('should accept max listeners parameter in constructor', () => {
    const emitter = new AsyncEventEmitter<TestEvents>(200)
    expect(emitter).toBeDefined()
  })

  it('should handle events with no arguments', async () => {
    const emitter = new AsyncEventEmitter<TestEvents>()
    const handler = vi.fn()

    emitter.on('noArgs', handler)
    await emitter.emit('noArgs')

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
