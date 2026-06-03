import { AsyncEventEmitter } from '@internals/utils'
import { type Config, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { consola } from 'consola'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from './logger.ts'

type GenStart = KubbHooks['kubb:generation:start'][0]
type PluginStart = KubbHooks['kubb:plugin:start'][0]
type PluginEnd = KubbHooks['kubb:plugin:end'][0]

describe('logger', () => {
  beforeEach(() => {
    consola.wrapAll()
    consola.mockTypes(() => vi.fn())
  })

  afterEach(() => {
    consola.restoreAll()
  })

  it('emits consola.info for kubb:info', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.info })

    await context.emit('kubb:info', { message: 'hello', info: 'world' })

    expect(consola.info).toHaveBeenCalledOnce()
    const arg = vi.mocked(consola.info).mock.calls[0]?.[0] as string
    expect(arg).toContain('hello')
    expect(arg).toContain('world')
  })

  it('emits consola.success for kubb:success', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.info })

    await context.emit('kubb:success', { message: 'done' })

    expect(consola.success).toHaveBeenCalledOnce()
  })

  it('emits consola.warn for kubb:warn', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.info })

    await context.emit('kubb:warn', { message: 'careful' })

    expect(consola.warn).toHaveBeenCalledOnce()
  })

  it('emits consola.error for kubb:error', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.info })

    await context.emit('kubb:error', { error: new Error('boom') })

    expect(consola.error).toHaveBeenCalledOnce()
    const arg = vi.mocked(consola.error).mock.calls[0]?.[0] as string
    expect(arg).toContain('boom')
  })

  it('drops info messages at silent', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.silent })

    await context.emit('kubb:info', { message: 'hidden' })
    await context.emit('kubb:success', { message: 'hidden' })

    expect(consola.info).not.toHaveBeenCalled()
    expect(consola.success).not.toHaveBeenCalled()
  })

  it('still surfaces errors at silent', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.silent })

    await context.emit('kubb:error', { error: new Error('still shown') })

    expect(consola.error).toHaveBeenCalledOnce()
  })

  it('drops warn at error level but keeps it at warn level', async () => {
    const errCtx = new AsyncEventEmitter<KubbHooks>()
    await logger.install(errCtx, { logLevel: logLevelMap.error })
    await errCtx.emit('kubb:warn', { message: 'no' })
    expect(consola.warn).not.toHaveBeenCalled()

    const warnCtx = new AsyncEventEmitter<KubbHooks>()
    await logger.install(warnCtx, { logLevel: logLevelMap.warn })
    await warnCtx.emit('kubb:warn', { message: 'yes' })
    expect(consola.warn).toHaveBeenCalledOnce()
  })

  it('renders the update-available diagnostic as a consola.box', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.info })

    await context.emit('kubb:diagnostic', {
      diagnostic: {
        kind: 'update',
        code: 'KUBB_UPDATE_AVAILABLE',
        severity: 'info',
        message: 'Update available',
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
      },
    })

    expect(consola.box).toHaveBeenCalledOnce()
  })

  it('logs a plugin lifecycle and progress line', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.info })

    const config = { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config

    await context.emit('kubb:generation:start', { config } as unknown as GenStart)
    await context.emit('kubb:plugin:start', { plugin: { name: '@kubb/plugin-zod' } } as unknown as PluginStart)
    await context.emit('kubb:plugin:end', { plugin: { name: '@kubb/plugin-zod' }, duration: 12, success: true } as unknown as PluginEnd)

    const lines = vi.mocked(consola.log).mock.calls.map((call) => String(call[0]))
    expect(lines.some((l) => l.includes('Generating'))).toBe(true)
    expect(lines.some((l) => l.includes('completed in'))).toBe(true)
    expect(lines.some((l) => l.includes('Plugins'))).toBe(true)
  })

  it('returns a hook sink factory that forwards stdout', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    const factory = await logger.install(context, { logLevel: logLevelMap.info })

    const sink = factory?.('prettier --write .', 'h1')
    sink?.onStdout?.('some line')
    expect(consola.log).toHaveBeenCalledWith('some line')
  })

  it('hook sink is silent at silent log level', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    const factory = await logger.install(context, { logLevel: logLevelMap.silent })

    const sink = factory?.('prettier', 'h1')
    expect(sink?.onStdout).toBeUndefined()
    expect(sink?.onStderr).toBeUndefined()
  })

  it('prefixes a timestamp at verbose level', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    await logger.install(context, { logLevel: logLevelMap.verbose })

    await context.emit('kubb:info', { message: 'hello' })

    const arg = vi.mocked(consola.info).mock.calls[0]?.[0] as string
    expect(arg).toMatch(/\[\d{2}:\d{2}:\d{2}\]/)
  })
})
