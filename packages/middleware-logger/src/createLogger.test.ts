import process from 'node:process'
import { AsyncEventEmitter } from '@internals/utils'
import { type Config, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { consola } from 'consola'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLogger } from './createLogger.ts'

type PluginStart = KubbHooks['kubb:plugin:start'][0]
type PluginEnd = KubbHooks['kubb:plugin:end'][0]

const singleConfig = [{ name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config]

describe('createLogger', () => {
  beforeEach(() => {
    consola.wrapAll()
    consola.mockTypes(() => vi.fn())
  })

  afterEach(() => {
    consola.restoreAll()
    vi.restoreAllMocks()
  })

  describe('consola surface (gha disabled)', () => {
    it('emits consola.info for kubb:info', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:info', { message: 'hello', info: 'world' })

      expect(consola.info).toHaveBeenCalledOnce()
      const arg = vi.mocked(consola.info).mock.calls[0]?.[0] as string
      expect(arg).toContain('hello')
      expect(arg).toContain('world')
    })

    it('emits consola.warn for kubb:warn', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:warn', { message: 'careful' })

      expect(consola.warn).toHaveBeenCalledOnce()
    })

    it('emits consola.error for kubb:error', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:error', { error: new Error('boom') })

      expect(consola.error).toHaveBeenCalledOnce()
      const arg = vi.mocked(consola.error).mock.calls[0]?.[0] as string
      expect(arg).toContain('boom')
    })

    it('drops info messages at silent', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.silent })

      await context.emit('kubb:info', { message: 'hidden' })
      await context.emit('kubb:success', { message: 'hidden' })

      expect(consola.info).not.toHaveBeenCalled()
      expect(consola.success).not.toHaveBeenCalled()
    })

    it('still surfaces errors at silent', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.silent })

      await context.emit('kubb:error', { error: new Error('still shown') })

      expect(consola.error).toHaveBeenCalledOnce()
    })

    it('renders the update-available diagnostic as a consola.box', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.info })

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

    it('returns a hook sink factory that forwards stdout', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      const factory = await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.info })

      const sink = factory?.('prettier --write .', 'h1')
      sink?.onStdout?.('some line')
      expect(consola.log).toHaveBeenCalledWith('some line')
    })

    it('hook sink is silent at silent log level', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      const factory = await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.silent })

      const sink = factory?.('prettier', 'h1')
      expect(sink?.onStdout).toBeUndefined()
      expect(sink?.onStderr).toBeUndefined()
    })

    it('prefixes a timestamp at verbose level', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.verbose })

      await context.emit('kubb:info', { message: 'hello' })

      const arg = vi.mocked(consola.info).mock.calls[0]?.[0] as string
      expect(arg).toMatch(/\[\d{2}:\d{2}:\d{2}\]/)
    })
  })

  describe('github actions annotations (gha enabled)', () => {
    let stdout: Array<string>
    let stderr: Array<string>

    beforeEach(() => {
      stdout = []
      stderr = []
      vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        stdout.push(String(chunk))
        return true
      })
      vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
        stderr.push(String(chunk))
        return true
      })
    })

    it('wraps Configuration in ::group:: / ::endgroup::', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: true }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:config:start')
      await context.emit('kubb:config:end', { configs: singleConfig })

      expect(stdout).toContain('::group::Configuration\n')
      expect(stdout).toContain('::endgroup::\n')
    })

    it('groups per-plugin when there is exactly one config', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: true }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:config:end', { configs: singleConfig })
      await context.emit('kubb:plugin:start', { plugin: { name: '@kubb/plugin-zod' } } as unknown as PluginStart)
      await context.emit('kubb:plugin:end', { plugin: { name: '@kubb/plugin-zod' }, duration: 1, success: true } as unknown as PluginEnd)

      expect(stdout.some((line) => line === '::group::Plugin: @kubb/plugin-zod\n')).toBe(true)
      expect(stdout.filter((line) => line === '::endgroup::\n').length).toBeGreaterThan(0)
    })

    it('emits ::warning:: for kubb:warn', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: true }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:warn', { message: 'careful' })

      expect(stdout).toContain('::warning::careful\n')
    })

    it('emits ::error:: for kubb:error and force-closes open groups', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: true }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:config:start')
      await context.emit('kubb:error', { error: new Error('boom') })

      expect(stdout).toContain('::group::Configuration\n')
      expect(stdout).toContain('::endgroup::\n')
      expect(stderr).toContain('::error::boom\n')
    })

    it('emits ::error:: for a problem diagnostic with severity=error', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: true }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:diagnostic', {
        diagnostic: {
          code: 'KUBB_REF_NOT_FOUND',
          severity: 'error',
          message: 'missing Pet',
          plugin: '@kubb/plugin-zod',
        },
      })

      const errors = stderr.filter((line) => line.startsWith('::error::'))
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('KUBB_REF_NOT_FOUND')
      expect(errors[0]).toContain('missing Pet')
      expect(errors[0]).toContain('[plugin: @kubb/plugin-zod]')
    })

    it('closes all open groups on lifecycle end', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: true }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:config:start')
      await context.emit('kubb:lifecycle:end')

      expect(stdout).toContain('::endgroup::\n')
    })

    it('does not group per-plugin when more than one config exists', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: true }).install(context, { logLevel: logLevelMap.info })

      const twoConfigs = [singleConfig[0], singleConfig[0]] as Array<Config>
      await context.emit('kubb:config:end', { configs: twoConfigs })
      await context.emit('kubb:plugin:start', { plugin: { name: '@kubb/plugin-zod' } } as unknown as PluginStart)

      expect(stdout.some((line) => line.startsWith('::group::Plugin:'))).toBe(false)
    })

    it('does not emit annotations when gha is false', async () => {
      const context = new AsyncEventEmitter<KubbHooks>()
      await createLogger({ gha: false }).install(context, { logLevel: logLevelMap.info })

      await context.emit('kubb:config:start')
      await context.emit('kubb:warn', { message: 'careful' })

      expect(stdout.every((line) => !line.startsWith('::'))).toBe(true)
    })
  })
})
