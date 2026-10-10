import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it } from 'vitest'
import { createMockedAdapter } from '../mocks.ts'
import { createKubb } from '../createKubb.ts'
import { Hookable } from '../Hookable.ts'
import { resolveCacheDir } from '../storages/cacheStorage.ts'
import { fsStorage } from '../storages/fsStorage.ts'
import { memoryStorage } from '../storages/memoryStorage.ts'
import type { Config, KubbHooks, KubbHookStartContext } from '../types.ts'
import type { Diagnostic } from '../Diagnostics.ts'
import { runOutputPasses } from './runOutputPasses.ts'

const node = process.execPath
const roots: Array<string> = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true })
    fs.rmSync(resolveCacheDir(root), { recursive: true, force: true })
  }
})

function makeConfig(output: Partial<Config['output']>): Config {
  return {
    root: process.cwd(),
    input: './petStore.yaml',
    output: { path: './gen', ...output },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [],
    storage: memoryStorage(),
  }
}

function record(hooks: Hookable<KubbHooks>): {
  names: Array<string>
  starts: Array<KubbHookStartContext>
  diagnostics: Array<Diagnostic>
  successes: Array<string>
} {
  const names: Array<string> = []
  const starts: Array<KubbHookStartContext> = []
  const diagnostics: Array<Diagnostic> = []
  const successes: Array<string> = []
  hooks.hook('kubb:success', ({ message }) => {
    successes.push(message)
  })
  for (const name of ['kubb:format:start', 'kubb:format:end', 'kubb:lint:start', 'kubb:lint:end', 'kubb:hooks:start', 'kubb:hooks:end'] as const) {
    hooks.hook(name, () => {
      names.push(name)
    })
  }
  hooks.hook('kubb:hook:start', (ctx) => {
    starts.push(ctx)
  })
  hooks.hook('kubb:diagnostic', ({ diagnostic }) => {
    diagnostics.push(diagnostic)
  })
  return { names, starts, diagnostics, successes }
}

describe('runOutputPasses', () => {
  it('returns no diagnostics and emits nothing when no pass is configured', async () => {
    const hooks = new Hookable<KubbHooks>()
    const seen = record(hooks)

    const diagnostics = await runOutputPasses({ config: makeConfig({}), outputPath: '/nowhere', hooks })

    expect(diagnostics).toStrictEqual([])
    expect(seen.names).toStrictEqual([])
  })

  it('runs postGenerate commands in order with their step names', async () => {
    const hooks = new Hookable<KubbHooks>()
    const seen = record(hooks)
    const config = makeConfig({ postGenerate: [`"${node}" -e "process.exit(0)"`, { name: 'types', command: `"${node}" -e "process.exit(0)"` }] })

    const diagnostics = await runOutputPasses({ config, outputPath: '/nowhere', hooks })

    expect(diagnostics).toStrictEqual([])
    expect(seen.names).toStrictEqual(['kubb:hooks:start', 'kubb:hooks:end'])
    expect(seen.starts.map((ctx) => ({ command: ctx.command, name: ctx.name }))).toStrictEqual([
      { command: node, name: undefined },
      { command: node, name: 'types' },
    ])
    expect(seen.successes).toHaveLength(2)
    expect(seen.successes[1]).toContain('types')
  })

  it('reports a failing postGenerate command as a coded diagnostic and keeps going', async () => {
    const hooks = new Hookable<KubbHooks>()
    const seen = record(hooks)
    const config = makeConfig({ postGenerate: [`"${node}" -e "process.exit(1)"`, { name: 'after', command: `"${node}" -e "process.exit(0)"` }] })

    const diagnostics = await runOutputPasses({ config, outputPath: '/nowhere', hooks })

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({ code: 'KUBB_POST_GENERATE_FAILED', severity: 'error', location: { kind: 'config' } })
    expect(diagnostics[0]?.message).toContain('Post-generate command failed')
    expect(seen.diagnostics).toStrictEqual(diagnostics)
    expect(seen.starts.map((ctx) => ctx.name)).toStrictEqual([undefined, 'after'])
  })

  it('announces the format pass but runs no tool when the output directory does not exist', async () => {
    const hooks = new Hookable<KubbHooks>()
    const seen = record(hooks)

    const diagnostics = await runOutputPasses({ config: makeConfig({ format: 'oxfmt' }), outputPath: path.join(os.tmpdir(), 'kubb-missing-output'), hooks })

    expect(diagnostics).toStrictEqual([])
    expect(seen.names).toStrictEqual(['kubb:format:start', 'kubb:format:end'])
    expect(seen.starts).toStrictEqual([])
  })

  it('formats the output directory with the configured formatter', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-output-'))
    roots.push(root)
    const outputPath = path.join(root, 'gen')
    fs.mkdirSync(outputPath)
    fs.writeFileSync(path.join(outputPath, 'pet.ts'), 'export const pet   =   {  id:1  }\n')
    const hooks = new Hookable<KubbHooks>()
    const seen = record(hooks)

    const diagnostics = await runOutputPasses({ config: makeConfig({ format: 'oxfmt' }), outputPath, hooks })

    expect(diagnostics).toStrictEqual([])
    expect(seen.starts.map((ctx) => ctx.command)).toStrictEqual(['oxfmt'])
    expect(seen.successes).toHaveLength(1)
    expect(seen.successes[0]).toContain('Formatting')
    expect(fs.readFileSync(path.join(outputPath, 'pet.ts'), 'utf8')).toBe('export const pet = { id: 1 }\n')
  })

  it('runs the passes from generate() by default', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-output-'))
    roots.push(root)
    const hooks = new Hookable<KubbHooks>()
    const seen = record(hooks)
    const config = { ...makeConfig({ postGenerate: [{ name: 'after', command: `"${node}" -e "process.exit(1)"` }] }), root, storage: fsStorage() }

    const result = await createKubb(config, { hooks }).generate()

    expect(result.success).toBe(false)
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toStrictEqual(['KUBB_POST_GENERATE_FAILED'])
    expect(seen.starts.map((ctx) => ctx.name)).toStrictEqual(['after'])
  })
})
