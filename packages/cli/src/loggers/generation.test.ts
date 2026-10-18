import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import {
  Hookable,
  cliReporter,
  type Config,
  type GeneratorContext,
  type KubbBuildStartContext,
  type KubbHooks,
  logLevel,
  type NormalizedPlugin,
  type ProblemDiagnostic,
  type Storage,
} from '@kubb/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as env from '../utils/env.ts'
import setupReporters from './reporters.ts'

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
  using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(rich)
  const lines: Array<string> = []
  using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(String(line)))

  const context = new Hookable<KubbHooks>()
  setupReporters(context, { logLevel: level, reporters: [cliReporter] })
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

function makeGeneratorContext(pluginName: string): GeneratorContext {
  return { plugin: makePlugin(pluginName) } as unknown as GeneratorContext
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
    await context.callHook('kubb:build:start', { nodeCounts: { schemas: 1, operations: 1 } } as KubbBuildStartContext)
    await context.callHook('kubb:plugin:start', { plugin: makePlugin('@kubb/plugin-ts') })
    await context.callHook('kubb:plugin:start', { plugin: makePlugin('@kubb/plugin-zod') })
    await context.callHook('kubb:generate:schema', { name: 'Pet' } as SchemaNode, makeGeneratorContext('@kubb/plugin-ts'))
    await context.callHook('kubb:generate:schema', { name: 'Pet' } as SchemaNode, makeGeneratorContext('@kubb/plugin-zod'))
    await context.callHook('kubb:generate:operation', { operationId: 'getPet' } as OperationNode, makeGeneratorContext('@kubb/plugin-ts'))
    await context.callHook('kubb:plugin:end', withFiles({ config, plugin: makePlugin('@kubb/plugin-ts'), duration: 12, success: true }))
    await context.callHook('kubb:plugin:end', withFiles({ config, plugin: makePlugin('@kubb/plugin-zod'), duration: 8, success: !pluginFailed }))
    await context.callHook('kubb:plugins:end', withFiles({ config }))

    await context.callHook('kubb:files:processing:start', { files: [file] })
    await context.callHook('kubb:files:processing:update', { files: [{ processed: 1, total: 1, percentage: 100, file, config }] })
    await context.callHook('kubb:files:processing:end', { files: [file], unchanged: [] })

    await context.callHook('kubb:format:start')
    await context.callHook('kubb:hook:start', { id: 'format', command: 'biome', args: ['format'] })
    await context.callHook('kubb:hook:end', {
      id: 'format',
      command: 'biome',
      args: ['format'],
      ...(formatFailed ? { success: false, error: new Error('biome failed') } : { success: true, error: null }),
    })
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
  it('reports the full run in order, grouped by config, with the summary after the group closes', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: true })

    expect(output.map(withoutDuration)).toStrictEqual([
      'intro:petstore petstore.yaml',
      'spinner.start:Parsing spec',
      'spinner.stop:Parsed spec  1 schema · 1 operation · ',
      'spinner.start:Generating',
      // Only the first plugin to start is named; every plugin starts before the shared walk.
      'spinner.message:Generating @kubb/plugin-ts',
      // The walk's progress over the spec's nodes, then each plugin's count and the node it just generated.
      // The next nodes land within one spinner frame, so they count without a redraw.
      'spinner.message:Generating  ██████████░░░░░░░░░░  1/2 nodes  \n│   @kubb/plugin-ts     1  Pet',
      'spinner.stop:Plugins 2/2 |  elapsed',
      'log.message:@kubb/plugin-ts completed in \n@kubb/plugin-zod completed in ',
      'spinner.start:Writing 1 file',
      'progress.advance:Writing src/gen/pet.ts',
      'spinner.stop:Wrote 1 file',
      'spinner.start:Formatting',
      'spinner.message:Running biome format',
      'spinner.stop:Formatted in ',
      'spinner.start:Linting',
      'spinner.stop:Linted in ',
      'spinner.start:Running post-generate hooks',
      'spinner.message:Running tsc --noEmit',
      'spinner.stop:Post-generate hooks completed in ',
      'log.message:✓ tsc --noEmit in ',
      'outro:✓ Generation succeeded',
      // The summary block, which the reporter renders as one entry after the group closes.
      'log.message.bare: Plugins  2 passed (2)\n   Files  1 generated\nDuration  \n  Output  /tmp/src/gen',
    ])
  })

  it('redraws the live block once a spinner frame has passed', async () => {
    vi.useFakeTimers()
    try {
      const output = await render(
        async (context) => {
          await context.callHook('kubb:generation:start', { config: makeConfig('petstore') })
          await context.callHook('kubb:build:start', { nodeCounts: { schemas: 2, operations: 0 } } as KubbBuildStartContext)
          await context.callHook('kubb:generate:schema', { name: 'Pet' } as SchemaNode, makeGeneratorContext('@kubb/plugin-ts'))
          vi.advanceTimersByTime(100)
          await context.callHook('kubb:generate:schema', { name: 'Tag' } as SchemaNode, makeGeneratorContext('@kubb/plugin-ts'))
        },
        { rich: true },
      )

      expect(output.filter((call) => call.startsWith('spinner.message:Generating  ')).map(withoutDuration)).toStrictEqual([
        'spinner.message:Generating  ██████████░░░░░░░░░░  1/2 nodes  \n│   @kubb/plugin-ts     1  Pet',
        'spinner.message:Generating  ████████████████████  2/2 nodes  \n│   @kubb/plugin-ts     2  Tag',
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves the per-node progress out of plain output, where each node would print its own line', async () => {
    const output = await render(generation({ config: makeConfig('petstore') }), { rich: false })

    expect(output.filter((line) => line.includes('Pet'))).toStrictEqual([])
  })

  it.each([
    { rich: true, failed: 'spinner.error:Formatting failed after ', done: 'spinner.stop:Formatted in ', next: 'spinner.stop:Linted in ' },
    { rich: false, failed: '✗ Formatting failed after ', done: 'Formatted in ', next: 'Linted in ' },
  ])('marks the formatting phase failed when its hook failed, and still runs the next phase (rich: $rich)', async ({ rich, failed, done, next }) => {
    const output = await render(generation({ config: makeConfig('petstore'), formatFailed: true }), { rich }).then((calls) => calls.map(withoutDuration))

    expect(output).toContain(failed)
    expect(output).not.toContain(done)
    expect(output).toContain(next)
  })

  it.each([
    { rich: true, failed: 'spinner.error:Plugins 1/2 (1 failed) |  elapsed', closed: 'outro:✗ Generation failed' },
    {
      rich: false,
      failed: '✗ Plugins 1/2 (1 failed) |  elapsed',
      closed: 'Kubb failed: an error. Exit code 1.\nRerun with --reporter json for machine-readable diagnostics.',
    },
  ])('keeps a failed plugin inside the group and closes it once, on the failure (rich: $rich)', async ({ rich, failed, closed }) => {
    const output = await render(generation({ config: makeConfig('petstore'), pluginFailed: true, status: 'failed' }), { rich })

    expect(output.map(withoutDuration)).toContain(failed)
    expect(output.some((call) => call.includes('@kubb/plugin-zod failed'))).toBe(true)
    // The group closes once, right before the summary.
    expect(output.filter((call) => call.includes('Generation failed') || call.startsWith('Kubb failed'))).toStrictEqual([closed])
    expect(output.at(rich ? -2 : -1)).toBe(closed)
  })

  it("prints a hook's own output past clack, and trims the blank lines around it", async () => {
    const { calls, lines } = await renderBoth(generation({ config: makeConfig('petstore'), hookLines: ['', 'tsc: no errors', ''] }))

    expect(lines).toContain('tsc: no errors')
    expect(calls.some((call) => call.includes('tsc: no errors'))).toBe(false)
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

  it('marks an error once while a step is running', async () => {
    const failDuringStep: Emit = async (context) => {
      await context.callHook('kubb:generation:start', { config: makeConfig('petstore') })
      await context.callHook('kubb:error', { error: new Error('No client plugin is registered.') })
    }

    const lines = await render(failDuringStep, { rich: false })
    expect(lines.some((line) => line.startsWith('error KUBB_UNKNOWN: No client plugin is registered.'))).toBe(true)
    expect(lines.some((line) => line.includes('✗ ✗'))).toBe(false)

    expect(await render(failDuringStep, { rich: true })).toContain('spinner.error:No client plugin is registered.')
  })

  it('prints every cause and where the root error was thrown', async () => {
    const lines = await render(
      async (context) => {
        await context.callHook('kubb:error', { error: new Error('Config failed loading: kubb.config.ts', { cause: new TypeError('x is undefined') }) })
      },
      { rich: false },
    )
    const output = lines.join('\n')

    expect(output).toContain('caused by: TypeError: x is undefined')
    expect(output).toMatch(/^\s+at .+:\d+:\d+/m)
  })
})

describe('plain generation output', () => {
  it('says files were generated rather than written when the run keeps them in memory', async () => {
    const config = { ...makeConfig('petstore'), storage: { name: 'memory' } } as unknown as Config
    const lines = await render(generation({ config }), { rich: false })

    expect(lines.filter((line) => /^(Writing|Wrote|Generat(ing|ed)) .*file/.test(line) || line.includes('pet.ts'))).toStrictEqual([
      'Generating 1 file',
      'Generating src/gen/pet.ts',
      'Generated 1 file in memory',
    ])
  })
})

/**
 * Both loggers run off one installer, so a run has to read the same way in either. Comparing the
 * message each one was given, with the writers' own symbols stripped, is what keeps them from
 * drifting apart again.
 */
describe('both loggers', () => {
  // Only the closing summary differs: an agent gets one verdict line instead of the human table.
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
        .filter((line) => line && !/^(Kubb succeeded|Generation succeeded|Plugins {2}|Files {2}|Duration|Output {2})/.test(line))
        .sort()
    // The per-node progress only redraws the rich spinner; plain output leaves it out on purpose.
    const richMessages = messages(rich).filter((line) => !/^(Generating {2}|│ {3})/.test(line))

    expect(messages(plain)).toStrictEqual(richMessages)
  })
})

describe('diagnostics per audience', () => {
  const problems: Array<ProblemDiagnostic> = [
    {
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'Could not find #/components/schemas/Owner',
      plugin: 'plugin-ts',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet/properties/owner' },
    },
    { code: 'KUBB_UNSUPPORTED_FORMAT', severity: 'warning', message: 'Format "money" falls back to string', plugin: 'plugin-ts' },
  ]

  const failedRun: Emit = async (context) => {
    const config = makeConfig('petstore')
    await context.callHook('kubb:generation:start', { config })
    for (const diagnostic of problems) await context.callHook('kubb:diagnostic', { diagnostic })
    await context.callHook('kubb:generation:end', {
      config,
      storage: {} as Storage,
      diagnostics: problems,
      filesCreated: 0,
      status: 'failed',
      hrStart: process.hrtime(),
    })
  }

  it('groups problems under their plugin for a human and closes on the counts', async () => {
    const calls = await render(failedRun, { rich: true })
    const block = stripVTControlCharacters(calls.find((call) => call.includes('plugin-ts')) ?? '')

    expect(block.split('\n').slice(0, 4)).toStrictEqual([
      'log.message.bare: plugin-ts',
      '',
      expect.stringMatching(/^ {2}✖ Could not find #\/components\/schemas\/Owner +KUBB_REF_NOT_FOUND$/),
      '    at   #/components/schemas/Pet/properties/owner',
    ])
    expect(block).toMatch(/⚠ Format "money" falls back to string +KUBB_UNSUPPORTED_FORMAT/)
    expect(calls.map((call) => stripVTControlCharacters(call))).toContain('outro:✖ Failed  1 error · 1 warning  in plugin-ts')
  })

  it('writes labeled rows and one verdict line for an agent', async () => {
    const lines = await render(failedRun, { rich: false })

    expect(lines).toContain(
      [
        'error KUBB_REF_NOT_FOUND [plugin-ts]: Could not find #/components/schemas/Owner',
        '  at: #/components/schemas/Pet/properties/owner',
        '  why: A `$ref` could not be resolved in the source document.',
        '  fix: Add the missing definition (for example under `components.schemas`) or fix the `$ref`. Run `kubb validate` to check the spec.',
        '  docs: https://kubb.dev/docs/5.x/reference/diagnostics#kubb-ref-not-found',
      ].join('\n'),
    )
    expect(lines.at(-1)).toBe('Kubb failed: 1 error, 1 warning (plugin-ts). Exit code 1.\nRerun with --reporter json for machine-readable diagnostics.')
  })
})

describe('diagnostics located in the spec', () => {
  let dir: string

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  function locatedRun(problem: ProblemDiagnostic): Emit {
    return async (context) => {
      dir = mkdtempSync(join(tmpdir(), 'kubb-frame-'))
      writeFileSync(
        join(dir, 'petstore.yaml'),
        ['components:', '  schemas:', '    Pet:', '      properties:', '        owner:', "          $ref: '#/components/schemas/Owner'", ''].join('\n'),
      )
      const config = { ...makeConfig('petstore'), root: dir }
      await context.callHook('kubb:generation:start', { config })
      await context.callHook('kubb:diagnostic', { diagnostic: problem })
      await context.callHook('kubb:generation:end', {
        config,
        storage: {} as Storage,
        diagnostics: [problem],
        filesCreated: 0,
        status: 'failed',
        hrStart: process.hrtime(),
      })
    }
  }

  const refNotFound: ProblemDiagnostic = {
    code: 'KUBB_REF_NOT_FOUND',
    severity: 'error',
    message: 'Could not find #/components/schemas/Owner',
    plugin: 'plugin-ts',
    location: { kind: 'schema', pointer: '#/components/schemas/Owner', ref: '#/components/schemas/Owner' },
  }

  it('shows a human the line and column with a code frame under the $ref that uses the missing schema', async () => {
    const calls = await render(locatedRun(refNotFound), { rich: true })
    const block = stripVTControlCharacters(calls.find((call) => call.includes('plugin-ts')) ?? '')
    const file = relative(process.cwd(), join(dir, 'petstore.yaml'))

    expect(block.split('\n').slice(3, 7)).toStrictEqual([
      `    at   ${file}:6:17`,
      '      5 │         owner:',
      "      6 │           $ref: '#/components/schemas/Owner'",
      '        │                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    ])
  })

  it('gives an agent file:line:col next to the pointer, without the frame', async () => {
    const lines = await render(locatedRun({ ...refNotFound, location: { kind: 'schema', pointer: '#/components/schemas/Pet/properties/owner' } }), {
      rich: false,
    })
    const file = relative(process.cwd(), join(dir, 'petstore.yaml'))

    expect(lines.join('\n')).toContain(`  at: ${file}:5:9 (#/components/schemas/Pet/properties/owner)`)
    expect(lines.join('\n')).not.toContain('│')
  })
})
