import type { FileNode } from '@kubb/ast'
import { Hookable, cliReporter, type Config, type KubbHooks, logLevel, type NormalizedPlugin, type Storage } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import * as agent from '../agent.ts'
import * as env from '../utils/env.ts'
import setupReporters from './utils.ts'

/**
 * Every clack call this logger makes, in order, as `name:text`. The sequence is the thing under
 * test: which group a line lands in, and whether a phase ended as done or failed.
 */
const calls: Array<string> = []

function record(name: string) {
  return (text?: string | Array<string>, options?: { symbol?: string }) =>
    void calls.push(`${name}${options?.symbol === '' ? '.bare' : ''}:${[text ?? ''].flat().join('\n')}`)
}

vi.mock('@clack/prompts', () => {
  const spinner = () => ({
    start: record('spinner.start'),
    stop: record('spinner.stop'),
    error: record('spinner.error'),
    message: record('spinner.message'),
    cancel: record('spinner.cancel'),
    clear: () => {},
    isCancelled: false,
  })

  return {
    intro: record('intro'),
    outro: record('outro'),
    box: record('box'),
    spinner: vi.fn(spinner),
    progress: vi.fn(() => ({
      ...spinner(),
      advance: (_step?: number, text?: string) => void calls.push(`progress.advance:${text ?? ''}`),
    })),
    log: {
      info: record('log.info'),
      success: record('log.success'),
      warn: record('log.warn'),
      error: record('log.error'),
      step: record('log.step'),
      message: record('log.message'),
    },
  }
})

type Emit = (context: Hookable<KubbHooks>) => Promise<void>

/**
 * Drives the given hook sequence through the logger the CLI would pick, with the `cli` reporter
 * installed the same way `kubb generate` installs it. Returns both what went to clack and what went
 * straight to the console, since a hook's own output deliberately bypasses clack.
 */
async function renderBoth(emit: Emit, { rich = true, level = logLevel.info }: { rich?: boolean; level?: number } = {}) {
  calls.length = 0
  using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(rich)
  using _agent = vi.spyOn(agent, 'getAgentName').mockReturnValue(undefined)
  const lines: Array<string> = []
  using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(String(line)))

  const context = new Hookable<KubbHooks>()
  await setupReporters(context, { logLevel: level, reporters: [cliReporter] })
  await emit(context)

  return { calls: calls.slice(), lines }
}

async function render(emit: Emit, { rich, level = logLevel.info }: { rich: boolean; level?: number }) {
  const { calls, lines } = await renderBoth(emit, { rich, level })

  return rich ? calls : lines
}

/**
 * Drops the elapsed times, which differ per run, so an assertion can state the rest exactly.
 */
function withoutDuration(call: string): string {
  return call.replace(/\d+(\.\d+)?(ms|s)/g, '')
}

function makeConfig(name: string): Config {
  return { name, root: '/tmp', input: 'petstore.yaml', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config
}

function makePlugin(name: string): NormalizedPlugin {
  return { name } as NormalizedPlugin
}

function makeFile(path: string): FileNode {
  return { path } as FileNode
}

/**
 * The `files` and `upsertFile` pair every file-carrying hook context adds, which no assertion here
 * looks at.
 */
function withFiles<T extends object>(extra: T): T & { files: Array<FileNode>; upsertFile: () => void } {
  return { ...extra, files: [], upsertFile: () => {} }
}

type GenerateOptions = {
  config: Config
  pluginFailed?: boolean
  formatFailed?: boolean
  hookLines?: Array<string>
  status?: 'success' | 'failed'
}

/**
 * One config's full lifecycle, in the order core and the generate runner emit it.
 */
function generation({ config, pluginFailed = false, formatFailed = false, hookLines = [], status = 'success' }: GenerateOptions): Emit {
  return async (context) => {
    const file = makeFile('/tmp/src/gen/pet.ts')

    await context.callHook('kubb:generation:start', { config })
    await context.callHook('kubb:plugin:start', { plugin: makePlugin('@kubb/plugin-ts') })
    await context.callHook('kubb:plugin:end', withFiles({ config, plugin: makePlugin('@kubb/plugin-ts'), duration: 12, success: true }))
    await context.callHook('kubb:plugin:end', withFiles({ config, plugin: makePlugin('@kubb/plugin-zod'), duration: 8, success: !pluginFailed }))
    await context.callHook('kubb:plugins:end', withFiles({ config }))

    await context.callHook('kubb:files:processing:start', { files: [file] })
    await context.callHook('kubb:files:processing:update', { files: [{ processed: 1, total: 1, percentage: 100, file, config }] })
    await context.callHook('kubb:files:processing:end', { files: [file] })

    await context.callHook('kubb:format:start')
    await context.callHook('kubb:hook:start', { id: 'format', command: 'biome', args: ['format'] })
    await context.callHook('kubb:hook:end', { id: 'format', command: 'biome', args: ['format'], success: !formatFailed, error: null })
    await context.callHook('kubb:format:end')

    await context.callHook('kubb:lint:start')
    await context.callHook('kubb:lint:end')

    await context.callHook('kubb:hooks:start')
    await context.callHook('kubb:hook:start', { id: 'post', command: 'tsc', args: ['--noEmit'] })
    for (const line of hookLines) {
      await context.callHook('kubb:hook:line', { id: 'post', line })
    }
    await context.callHook('kubb:hook:end', { id: 'post', command: 'tsc', args: ['--noEmit'], success: true, error: null })
    await context.callHook('kubb:hooks:end')

    await context.callHook('kubb:generation:end', {
      config,
      storage: {} as Storage,
      diagnostics: [],
      filesCreated: 1,
      status,
      hrStart: process.hrtime(),
    })
  }
}

describe('grouped generation output', () => {
  it('opens a group for the config name and closes it with the run result', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: true })

    expect(output.filter((call) => call.startsWith('intro:') || call.startsWith('outro:'))).toStrictEqual([
      'intro:petstore petstore.yaml',
      'outro:✓ Generation succeeded',
    ])
  })

  it('gives each named config its own group, with no numeric generation label', async () => {
    const first = generation({ config: makeConfig('petstore') })
    const second = generation({ config: makeConfig('orders') })
    const output = await render(
      async (context) => {
        await first(context)
        await second(context)
      },
      { rich: true },
    )

    const boundaries = output.filter((call) => call.startsWith('intro:') || call.startsWith('outro:'))
    expect(boundaries).toStrictEqual([
      'intro:petstore petstore.yaml',
      'outro:✓ Generation succeeded',
      'intro:orders petstore.yaml',
      'outro:✓ Generation succeeded',
    ])
    expect(output.some((call) => /Generation \d/.test(call))).toBe(false)
  })

  it('loads the config once, so the group does not repeat what the bootstrap already said', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: true })

    expect(output.filter((call) => call.includes('Config loaded'))).toStrictEqual([])
  })

  it('ends each phase at its own completion point, as done', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: true })

    expect(output.filter((call) => call.startsWith('spinner.stop:') || call.startsWith('spinner.error:')).map(withoutDuration)).toStrictEqual([
      'spinner.stop:Plugins 2/2 |  elapsed',
      'spinner.stop:Wrote 1 file',
      'spinner.stop:Formatted in ',
      'spinner.stop:Linted in ',
      'spinner.stop:Post-generate hooks completed in ',
    ])
  })

  it('fails the formatting phase when its hook failed, and still runs and reports the next phase', async () => {
    const output = await render(generation({ config: makeConfig('petstore'), formatFailed: true }), { rich: true }).then((calls) => calls.map(withoutDuration))

    expect(output).toContain('spinner.error:Formatting failed after ')
    expect(output).not.toContain('spinner.stop:Formatted in ')
    expect(output).toContain('spinner.stop:Linted in ')
  })

  it('keeps a failed plugin inside the group and lets the run result carry it', async () => {
    const output = await render(generation({ config: makeConfig('petstore'), pluginFailed: true, status: 'failed' }), { rich: true })

    expect(output.map(withoutDuration)).toContain('spinner.error:Plugins 1/2 (1 failed) |  elapsed')
    expect(output.some((call) => call.includes('@kubb/plugin-zod failed'))).toBe(true)
    // The group closes once, at the end, on the failure.
    expect(output.filter((call) => call.startsWith('outro:'))).toStrictEqual(['outro:✗ Generation failed'])
  })

  it('reports each plugin result once the spinner has released the line', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: true })

    const pluginSummary = output.findIndex((call) => call.startsWith('spinner.stop:Plugins 2/2'))
    expect(withoutDuration(output[pluginSummary + 1] ?? '')).toBe('log.message:@kubb/plugin-ts completed in \n@kubb/plugin-zod completed in ')
  })

  it("prints a hook's own output past clack, and trims the blank lines around it", async () => {
    const { calls, lines } = await renderBoth(generation({ config: makeConfig('petstore'), hookLines: ['', 'tsc: no errors', ''] }))

    expect(lines).toContain('tsc: no errors')
    expect(calls.some((call) => call.includes('tsc: no errors'))).toBe(false)
  })

  it('stops the write progress bar once the files are written', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: true })

    expect(output).toContain('progress.advance:Writing src/gen/pet.ts')
    expect(output.filter((call) => call.startsWith('spinner.start:Writing'))).toHaveLength(1)
  })

  it('closes a group the run abandoned, so an intro never dangles', async () => {
    // A failing setup throws before `kubb:generation:end`, so the summary never runs.
    const output = await render(
      async (context) => {
        await context.callHook('kubb:generation:start', { config: makeConfig('petstore') })
        await context.callHook('kubb:error', { error: new Error('Config input not found') })
        await context.callHook('kubb:lifecycle:end')
      },
      { rich: true },
    )

    expect(output.filter((call) => call.startsWith('intro:') || call.startsWith('outro:'))).toStrictEqual([
      'intro:petstore petstore.yaml',
      'outro:✗ Generation failed',
    ])
  })

  it('counts one file as a file', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: true })

    expect(output).toContain('spinner.start:Writing 1 file')
    expect(output).toContain('spinner.stop:Wrote 1 file')
  })

  it('keeps what a phase reported, rather than spending it on a spinner frame', async () => {
    const output = await render(
      async (context) => {
        await context.callHook('kubb:format:start')
        await context.callHook('kubb:info', { message: 'Auto-detected formatter: oxfmt' })
        await context.callHook('kubb:format:end')
      },
      { rich: true },
    )

    expect(output.some((call) => call.startsWith('log.message:') && call.includes('Auto-detected formatter: oxfmt'))).toBe(true)
  })

  it('renders the summary before the group closes', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: true })

    const summary = output.findIndex((call) => call.includes('2 passed (2)'))
    expect(summary).toBeGreaterThan(-1)
    expect(summary).toBeLessThan(output.indexOf('outro:✓ Generation succeeded'))
  })
})

describe('plain generation output', () => {
  it('reports the same run in the same order, without the animation', async () => {
    const lines = await render(generation({ config: makeConfig('petstore') }), { rich: false })

    // Everything up to the summary block, which the reporter renders as one entry.
    expect(lines.slice(0, -2).map(withoutDuration)).toStrictEqual([
      'petstore petstore.yaml',
      'Generating',
      'Generating @kubb/plugin-ts',
      'Plugins 2/2 |  elapsed',
      '@kubb/plugin-ts completed in \n@kubb/plugin-zod completed in ',
      'Writing 1 file',
      'Writing src/gen/pet.ts',
      'Wrote 1 file',
      'Formatting',
      'Formatted in ',
      'Linting',
      'Linted in ',
      'Running post-generate hooks',
      'Post-generate hooks completed in ',
      '✓ tsc --noEmit in ',
    ])
    expect(lines.at(-1)).toBe('✓ Generation succeeded')
  })

  it('marks a failed phase as failed and still runs the next one', async () => {
    const lines = await render(generation({ config: makeConfig('petstore'), formatFailed: true }), { rich: false })

    expect(lines.map(withoutDuration)).toContain('✗ Formatting failed after ')
    expect(lines.map(withoutDuration)).toContain('Linted in ')
  })

  it('closes the group on the failure when a plugin failed', async () => {
    const lines = await render(generation({ config: makeConfig('orders'), pluginFailed: true, status: 'failed' }), { rich: false })

    expect(lines.map(withoutDuration)).toContain('✗ Plugins 1/2 (1 failed) |  elapsed')
    expect(lines.at(-1)).toBe('✗ Generation failed')
  })
})

/**
 * Both loggers run off one installer, so a run has to read the same way in either. Comparing the
 * message each one was given, with the writers' own symbols stripped, is what keeps them from
 * drifting apart again.
 */
describe('both loggers', () => {
  it('report the same run, in the same order', async () => {
    const emit = () => generation({ config: makeConfig('petstore'), hookLines: ['tsc: no errors'] })

    // Rich output is split across clack and the console, since a hook's own output bypasses clack.
    const richRun = await renderBoth(emit(), { rich: true })
    const rich = [...richRun.calls.map((call) => call.slice(call.indexOf(':') + 1)), ...richRun.lines]
    const plain = (await renderBoth(emit(), { rich: false })).lines

    const messages = (source: Array<string>) =>
      source
        .flatMap((line) => line.split('\n'))
        .map((line) =>
          withoutDuration(line)
            .replace(/^[◇✓✗]\s*/, '')
            .trim(),
        )
        .filter(Boolean)
        .sort()

    expect(messages(plain)).toStrictEqual(messages(rich))
  })
})
