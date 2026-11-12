import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hookable } from '../Hookable.ts'
import { createMockedAdapter } from '../mocks.ts'
import { memoryStorage } from '../storages/memoryStorage.ts'
import type { Config, KubbHooks } from '../types.ts'
import { runHook } from './runHook.ts'
import { ARGS_LIMIT, chunkPaths, runOutputPasses } from './runOutputPasses.ts'

vi.mock('./runHook.ts', () => ({ runHook: vi.fn(async () => ({ success: true, error: null })) }))

const spawned = vi.mocked(runHook)
let root = ''

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-passes-'))
  fs.mkdirSync(path.join(root, 'gen'))
  spawned.mockClear()
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

function makeConfig(output: Partial<Config['output']>): Config {
  return {
    root,
    input: './petStore.yaml',
    output: { path: './gen', ...output },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [],
    storage: memoryStorage(),
  }
}

function run({ output, files }: { output: Partial<Config['output']>; files?: Array<string> }) {
  return runOutputPasses({ config: makeConfig(output), outputPath: path.join(root, 'gen'), files, hooks: new Hookable<KubbHooks>() })
}

function calls() {
  return spawned.mock.calls.map(([options]) => ({ command: options.command, args: options.args }))
}

describe('runOutputPasses with a file list', () => {
  it('passes only the listed files, relative to the root, to a formatter that takes a list', async () => {
    await run({ output: { format: 'prettier' }, files: [path.join(root, 'gen/a.ts'), path.join(root, 'gen/b.ts')] })

    expect(calls()).toStrictEqual([{ command: 'prettier', args: ['--ignore-unknown', '--write', path.join('gen', 'a.ts'), path.join('gen', 'b.ts')] }])
  })

  it('runs a linter and a formatter without a file list over the whole directory', async () => {
    await run({ output: { format: 'oxfmt', lint: 'oxlint' }, files: [path.join(root, 'gen/a.ts')] })

    expect(calls()).toStrictEqual([
      { command: 'oxfmt', args: [path.join(root, 'gen')] },
      { command: 'oxlint', args: ['--fix', '--no-ignore', path.join(root, 'gen')] },
    ])
  })

  it('spawns nothing when no file was written, while postGenerate still runs', async () => {
    await run({ output: { format: 'biome', lint: 'eslint', postGenerate: ['echo done'] }, files: [] })

    expect(calls()).toStrictEqual([{ command: 'echo', args: ['done'] }])
  })

  it('runs over the whole directory when no file list is given', async () => {
    await run({ output: { format: 'biome' } })

    expect(calls()).toStrictEqual([{ command: 'biome', args: ['format', '--write', path.join(root, 'gen')] }])
  })

  it('splits a list longer than the argument limit over several spawns', async () => {
    const name = `${'x'.repeat(200)}.ts`
    const files = Array.from({ length: Math.ceil(ARGS_LIMIT / name.length) * 2 }, (_, index) => path.join(root, 'gen', `${index}${name}`))

    await run({ output: { format: 'biome' }, files })

    const lists = calls().map(({ args }) => (args ?? []).slice(3))
    expect(lists.length).toBeGreaterThan(1)
    expect(lists.flat()).toStrictEqual(files.map((file) => path.relative(root, file)))
    for (const list of lists) expect(list.join(' ').length).toBeLessThanOrEqual(ARGS_LIMIT)
  })

  it('stops at the first failing chunk and reports it', async () => {
    spawned.mockResolvedValueOnce({ success: false, error: new Error('boom') })
    const files = Array.from({ length: 3 }, (_, index) => path.join(root, 'gen', `${index}.ts`))

    const diagnostics = await runOutputPasses({
      config: makeConfig({ format: 'prettier' }),
      outputPath: path.join(root, 'gen'),
      files,
      hooks: new Hookable<KubbHooks>(),
    })

    expect(spawned).toHaveBeenCalledTimes(1)
    expect(diagnostics[0]).toMatchObject({ code: 'KUBB_FORMAT_FAILED' })
  })
})

describe('chunkPaths', () => {
  it.each([
    ['fits one chunk', ['a', 'b', 'c'], 10, [['a', 'b', 'c']]],
    ['splits at the limit', ['aaaa', 'bbbb', 'cccc'], 10, [['aaaa', 'bbbb'], ['cccc']]],
    ['keeps an oversized path on its own', ['a', 'b'.repeat(20), 'c'], 10, [['a'], ['b'.repeat(20)], ['c']]],
    ['returns nothing for nothing', [], 10, []],
  ])('%s', (_name, paths, limit, expected) => {
    expect(chunkPaths({ paths, limit })).toStrictEqual(expected)
  })
})
