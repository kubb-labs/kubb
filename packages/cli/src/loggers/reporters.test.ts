import { stripVTControlCharacters } from 'node:util'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ast } from '@kubb/ast'
import {
  Hookable,
  cliReporter,
  type Config,
  createKubb,
  createReporter,
  fsStorage,
  type GenerationResult,
  jsonReporter,
  type KubbHooks,
  logLevel,
  memoryStorage,
  type Storage,
} from '@kubb/core'
import { createMockedPlugin } from '@kubb/core/mocks'
import { getAgentProfile } from 'gunshi/agent'
import { describe, expect, it, vi } from 'vitest'
import * as env from '../utils/env.ts'
import setupReporters from './reporters.ts'
import { createPlainWriter } from './plainWriter.ts'

vi.mock('gunshi/agent', () => ({ getAgentProfile: vi.fn(() => ({ isAgent: false })) }))

describe('setupReporters', () => {
  it('attributes each file to its first plugin for every reporter and resets between configs', async () => {
    const hooks = new Hookable<KubbHooks>()
    const results: Array<{ name: string; files: GenerationResult['pluginFiles'] }> = []
    const drained: Array<string> = []
    const reporters = ['first', 'second', 'withoutFiles'].map((name) =>
      createReporter({
        name,
        needsPluginFiles: name !== 'withoutFiles',
        report(result) {
          results.push({ name, files: result.pluginFiles })
        },
        drain() {
          drained.push(name)
        },
      }),
    )
    setupReporters(hooks, { logLevel: logLevel.info, reporters })
    const file = ast.factory.createFile({ path: '/gen/shared.ts', baseName: 'shared.ts' })
    for (const name of ['one', 'two']) {
      const kubb = createKubb({ name, root: '/tmp', input: './spec.yaml', output: { path: './gen' }, storage: memoryStorage() })
      const config = kubb.config
      const plugin = createMockedPlugin({ name: `plugin-${name}`, options: { output: { path: './gen' }, exclude: [], override: [] } })
      const completion = { config, plugin, files: [file], upsertFile: vi.fn(), duration: 0, success: true }
      await hooks.callHook('kubb:generation:start', { config })
      await hooks.callHook('kubb:plugin:end', completion)
      await hooks.callHook('kubb:plugin:end', { ...completion, plugin: { ...plugin, name: 'duplicate' } })
      await hooks.callHook('kubb:generation:end', { config, storage: memoryStorage(), filesCreated: 1 })
    }
    await hooks.callHook('kubb:lifecycle:end')

    expect(results).toStrictEqual([
      { name: 'first', files: [{ plugin: 'plugin-one', files: ['/gen/shared.ts'] }] },
      { name: 'second', files: [{ plugin: 'plugin-one', files: ['/gen/shared.ts'] }] },
      { name: 'withoutFiles', files: undefined },
      { name: 'first', files: [{ plugin: 'plugin-two', files: ['/gen/shared.ts'] }] },
      { name: 'second', files: [{ plugin: 'plugin-two', files: ['/gen/shared.ts'] }] },
      { name: 'withoutFiles', files: undefined },
    ])
    expect(drained).toStrictEqual(['first', 'second', 'withoutFiles'])
  })

  it.each([false, true])('reports content changes across cleaning, including plugin output outside the main folder (dry run: %s)', async (dryRun) => {
    const root = await mkdtemp(join(tmpdir(), 'kubb-summary-report-'))
    try {
      const output = join(root, 'gen')
      await mkdir(output)
      const pet = join(output, 'pet.ts'),
        same = join(output, 'same.ts'),
        stale = join(output, 'stale.ts'),
        added = join(output, 'new.ts'),
        outside = join(root, 'outside.ts')
      await Promise.all(
        [
          [pet, 'old'],
          [same, 'same'],
          [stale, 'gone'],
          [outside, 'before'],
        ].map(([path, value]) => writeFile(path!, value!)),
      )
      const storage = dryRun ? memoryStorage() : fsStorage()
      const config = createKubb({ root, input: './openapi.yaml', output: { path: output, clean: true }, storage }).config
      const hooks = new Hookable<KubbHooks>()
      const lines: Array<string> = []
      const reports: Array<GenerationResult> = []
      setupReporters(hooks, {
        logLevel: logLevel.info,
        reporters: [cliReporter, createReporter({ name: 'custom', report: (result) => void reports.push(result) })],
        dryRun,
        writer: createPlainWriter((line) => lines.push(line)),
      })
      await hooks.callHook('kubb:generation:start', { config })
      await hooks.callHook('kubb:plugins:end', { config, files: [], upsertFile: () => {} })
      if (!dryRun) {
        await rm(output, { recursive: true })
        await mkdir(output)
      }
      const files = [pet, same, added, outside].map((path) => ast.factory.createFile({ path, baseName: 'example.ts' }))
      await hooks.callHook('kubb:files:processing:start', { files })
      for (const [path, value] of [
        [pet, 'new'],
        [same, 'same'],
        [added, 'fresh'],
        [outside, 'after'],
      ] as const) {
        await storage.writeItem(path, value)
        await hooks.callHook('kubb:file:processed', { file: files.find((file) => file.path === path)!, source: value })
      }
      await hooks.callHook('kubb:files:processing:end', { files, unchanged: [] })
      await hooks.callHook('kubb:generation:end', { config, storage, filesCreated: files.length, status: 'success', hrStart: process.hrtime() })
      const text = stripVTControlCharacters(lines.join('\n'))
      expect(text).toContain(`3 files ${dryRun ? 'planned' : 'generated'} · 1 unchanged`)
      expect(text).toContain('1 added · 2 modified · 1 deleted')
      expect(text).toContain('Lines  +3 −3')
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({ filesCreated: files.length, filesUnchanged: 0 })
      expect(reports[0]?.fileChanges).toBeUndefined()
      if (dryRun) {
        expect(text).toContain('Nothing was written.')
        expect(await readFile(stale, 'utf8')).toBe('gone')
      }
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('lets json own stdout without installing the live logger when json is selected', async () => {
    const context = new Hookable<KubbHooks>()

    setupReporters(context, { logLevel: logLevel.info, reporters: [jsonReporter] })

    expect(context.listenerCount('kubb:hook:line')).toBe(0)
    expect(context.listenerCount('kubb:generation:end')).toBeGreaterThan(0)
  })

  it('holds the json output until lifecycle end, then writes one array for every config', async () => {
    const context = new Hookable<KubbHooks>()
    const writes: Array<string> = []
    using _write = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk))
      return true
    })

    setupReporters(context, { logLevel: logLevel.info, reporters: [jsonReporter] })

    await context.callHook('kubb:generation:end', {
      config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
      storage: {} as Storage,
      diagnostics: [{ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing Pet', plugin: '@kubb/plugin-zod' }],
      filesCreated: 3,
      status: 'failed',
      hrStart: process.hrtime(),
    })
    await context.callHook('kubb:generation:end', {
      config: { name: 'orders', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
      storage: {} as Storage,
      diagnostics: [],
      filesCreated: 5,
      status: 'success',
      hrStart: process.hrtime(),
    })
    expect(writes).toStrictEqual([])

    await context.callHook('kubb:lifecycle:end')

    expect(writes).toHaveLength(1)
    const reports = JSON.parse(writes[0]!)
    expect(reports).toHaveLength(2)
    expect(reports[0]).toMatchObject({ name: 'petstore', status: 'failed', counts: { errors: 1 } })
    expect(reports[1]).toMatchObject({ name: 'orders', status: 'success' })
  })

  /** A usable terminal outside CI, so only the agent decides which logger `isRichOutput` picks. */
  function withInteractiveStdout(): Disposable {
    const { isTTY, columns } = process.stdout
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true })
    Object.defineProperty(process.stdout, 'columns', { value: 80, writable: true, configurable: true })
    vi.stubEnv('CI', '')
    vi.stubEnv('GITHUB_ACTIONS', '')

    return {
      [Symbol.dispose]() {
        Object.defineProperty(process.stdout, 'isTTY', { value: isTTY, writable: true, configurable: true })
        Object.defineProperty(process.stdout, 'columns', { value: columns, writable: true, configurable: true })
        vi.unstubAllEnvs()
      },
    }
  }

  /**
   * Both loggers open a group, but only the plain one writes it with `console.log`: clack draws
   * straight to the stream. Colors are stripped, since the stubbed terminal makes `styleText` emit them.
   */
  async function renderGroup() {
    const context = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(stripVTControlCharacters(String(line))))

    setupReporters(context, { logLevel: logLevel.info, reporters: [cliReporter] })
    await context.callHook('kubb:generation:start', {
      config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [] } as unknown as Config,
    })

    return lines
  }

  it.each([
    { agentName: 'claude', plain: true, label: 'an AI agent is detected' },
    { agentName: undefined, plain: false, label: 'no AI agent is detected' },
  ])('installs the plain logger: $plain when a TTY is available and $label', async ({ agentName, plain }) => {
    using _stdout = withInteractiveStdout()
    using _agent = vi.mocked(getAgentProfile).mockReturnValue({ isAgent: Boolean(agentName), name: agentName })

    expect((await renderGroup()).includes('petstore')).toBe(plain)
  })
})

describe('studio session events', () => {
  /**
   * A `kubb studio` connection emits `studio:*` on the same emitter as its generations, so the
   * loggers `kubb generate` installs render the whole command. Non-TTY here, so `plainWriter`
   * answers and the output is plain text.
   */
  async function render(emit: (context: Hookable<KubbHooks>) => Promise<void> | void, level: number = logLevel.info) {
    using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)
    const context = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((line) => void lines.push(String(line)))

    setupReporters(context, { logLevel: level, reporters: [cliReporter] })
    await emit(context)

    return lines
  }

  it('reports the connection, a command, a retry, a refused permission, and a takeover, in order', async () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 1, 14, 5, 2) })
    const lines = await render(async (context) => {
      await context.callHook('studio:connected', {
        url: 'http://localhost:3000',
        versions: { studio: '5.1.0', kubb: '5.0.6', agent: '5.0.6' },
        sandbox: false,
        agentSlug: 'brave-otter',
        studioVersion: '5.1.0',
      })
      await context.callHook('studio:command', { command: 'saveConfig', info: 'applied 2/3 edits to kubb.config.ts' })
      await context.callHook('studio:reconnecting', { delayMs: 30_000 })
      await context.callHook('studio:warn', { message: 'Ignored save: editing kubb.config.ts was not granted', permission: 'allowConfigEdit' })
      await context.callHook('studio:disconnected', { code: 4002, reason: '' })
    })

    expect(lines).toStrictEqual([
      '✓ Connected to http://localhost:3000 · v5.0.6 · Studio v5.1.0',
      'Ready for jobs',
      '14:05:02  saveConfig ✓ (applied 2/3 edits to kubb.config.ts)',
      'Ready for jobs',
      'Retrying connection to Kubb Studio in 30.00s',
      '⚠ Ignored save: editing kubb.config.ts was not granted; pass --allow-config-edit to allow it',
      '⚠ Another process connected to Kubb Studio as this agent, so this one stopped',
    ])
    vi.useRealTimers()
  })

  it('logs a generate job with who asked, its file count and duration, and a failed one with its errors', async () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 1, 14, 9, 13) })
    const lines = await render(async (context) => {
      await context.callHook('studio:connected', {
        url: 'http://localhost:3000',
        versions: { studio: '5.1.0', kubb: '5.0.6', agent: '5.0.6' },
        sandbox: false,
        agentSlug: 'brave-otter',
        studioVersion: '5.1.0',
      })
      const generation = {
        config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
        storage: {} as Storage,
        hrStart: process.hrtime(),
      }
      await context.callHook('kubb:generation:end', { ...generation, diagnostics: [], filesCreated: 122, status: 'success' })
      await context.callHook('studio:command', { command: 'generate', info: '3 plugins, in memory', requestedBy: 'Stijn' })
      await context.callHook('kubb:generation:end', {
        ...generation,
        diagnostics: [{ code: 'KUBB_UNKNOWN', severity: 'error', message: 'Broken spec' }],
        filesCreated: 0,
        status: 'failed',
      })
      await context.callHook('studio:command', { command: 'generate', info: 'Broken spec', requestedBy: 'Ana', failed: true })
      await context.callHook('studio:command', { command: 'saveConfig', info: 'applied 1/1 edits to kubb.config.ts', requestedBy: 'Stijn Van Hulle-Peeters' })
    })
    vi.useRealTimers()

    expect(lines).toContainEqual(expect.stringMatching(/^14:09:13 {2}generate {3}by Stijn {9}✓ 122 files in \S+ \(3 plugins, in memory\)$/))
    expect(lines).toContain('14:09:13  generate   by Ana           ✖ 1 error, see Studio')
    expect(lines).toContain('14:09:13  saveConfig by Stijn Van Hulle-Peeters ✓ (applied 1/1 edits to kubb.config.ts)')
  })

  it('drops everything but errors at silent', async () => {
    const lines = await render(async (context) => {
      await context.callHook('studio:disconnected', { code: 1006, reason: '' })
      await context.callHook('studio:warn', { message: 'Ignored save' })
      // A failure stays visible, or the command exits without saying why.
      await context.callHook('studio:error', { error: new Error('token revoked') })
    }, logLevel.silent)

    expect(lines).toStrictEqual(['✗ token revoked'])
  })
})
