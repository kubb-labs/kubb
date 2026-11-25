import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { ast } from '@kubb/ast'
import { type Config, defineExtension, Diagnostics, fsStorage, memoryStorage, type PostGenerateCommand, resolveMeta, type UserConfig } from '@kubb/core'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as config from '../../config.ts'
import * as mascot from '../../ui/mascot.ts'
import * as env from '../../utils/env.ts'
import { run } from './run.ts'

// The update check reads `KUBB_HOME`, so a notice stored by a real run never leaks into these tests.
const kubbHome = mkdtempSync(join(tmpdir(), 'kubb-cli-home-'))
beforeEach(() => void vi.stubEnv('KUBB_HOME', kubbHome))
afterEach(() => void vi.unstubAllEnvs())
afterAll(() => rmSync(kubbHome, { recursive: true, force: true }))

type BootstrapOptions = {
  /**
   * Reject the config load, with this error or a plain one, so the group has a failure to report.
   */
  fail?: boolean | Error
  reporters?: Array<'cli' | 'json'>
  /**
   * Configs the mocked loader returns. Empty renders only the Configuration group.
   */
  configs?: Array<Config>
  check?: boolean
  diff?: boolean
  force?: boolean
  dryRun?: boolean
}

/**
 * Runs the command with no configs to generate, so only the bootstrap Configuration group renders.
 * Non-rich, so the group is plain text an assertion can read.
 */
async function bootstrap({ fail = false, reporters, configs = [], check, diff, force, dryRun }: BootstrapOptions = {}) {
  const lines: Array<string> = []
  // What reached stdout alone, since `json` keeps it for the report.
  const stdout: Array<string> = []
  using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)
  using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(false)
  using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => {
    lines.push(String(line))
    stdout.push(String(line))
  })
  using _warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  using _error = vi.spyOn(console, 'error').mockImplementation((line = '') => void lines.push(String(line)))
  using _fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
  using _exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`)
  }) as never)
  using _configs = vi
    .spyOn(config, 'getConfigs')
    .mockImplementation(() =>
      fail
        ? Promise.reject(fail instanceof Error ? fail : new Error('Config not defined'))
        : Promise.resolve({ configs, configPath: `${process.cwd()}/kubb.config.ts` }),
    )

  await run({ logLevel: 'info', watch: false, reporters, check, diff, force, dryRun }).catch((error: Error) => void lines.push(error.message))
  // A failed build sets `exitCode` instead of calling `exit()`, so telemetry can finish; record it the same way.
  if (process.exitCode) lines.push(`exit ${process.exitCode}`)
  process.exitCode = undefined

  return Object.assign(lines, { stdout, fetchCalls: _fetch.mock.calls.length })
}

describe('bootstrap configuration group', () => {
  it('spins while the config loads and reports what it loaded', async () => {
    const lines = await bootstrap()

    expect(lines).toContain('Loading config')
    expect(lines).toContain('Loaded kubb.config.ts')
    expect(lines).toContain('0 configs ready')
  })

  it('marks the step failed and closes the group when the config cannot load', async () => {
    const lines = await bootstrap({ fail: true })

    expect(lines).toContain('✗ Config failed loading')
    expect(lines).toContain('✗ Configuration failed')
    expect(lines.at(-1)).toBe('exit 1')
  })

  it('reports a diagnostic thrown while the config file runs with its code', async () => {
    // An extension with neither `meta.name` nor `name` throws KUBB_INVALID_PLUGIN_OPTIONS.
    const cause = (() => {
      try {
        resolveMeta({})
      } catch (error) {
        return error
      }
    })()

    const lines = await bootstrap({ fail: new Error('Config failed loading', { cause }) })

    expect(lines.some((line) => line.includes('error KUBB_INVALID_PLUGIN_OPTIONS') && line.includes('neither `meta.name` nor `name`'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })

  it('writes a config failure to stderr, not stdout, when json owns stdout', async () => {
    const lines = await bootstrap({ fail: new Error('Config failed loading: kubb.config.ts', { cause: new Error('boom') }), reporters: ['json'] })

    expect(lines.stdout).toStrictEqual([])
    expect(lines.some((line) => line.includes('Config failed loading: kubb.config.ts'))).toBe(true)
    expect(lines.some((line) => line.includes('caused by: boom'))).toBe(true)
  })

  it('writes nothing of its own when json owns stdout', async () => {
    const lines = await bootstrap({ reporters: ['json'] })

    expect([...lines]).toStrictEqual([])
  })
})

const CI_VARIABLES = [
  'CI',
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'BITBUCKET_BUILD_NUMBER',
  'JENKINS_URL',
  'CIRCLECI',
  'TRAVIS',
  'TEAMCITY_VERSION',
  'BUILDKITE',
  'TF_BUILD',
]

describe('update notice', () => {
  afterEach(() => rmSync(join(kubbHome, 'cache'), { recursive: true, force: true }))

  it('prints the notice from a fresh stored check without asking the registry', async () => {
    for (const name of CI_VARIABLES) vi.stubEnv(name, '')
    mkdirSync(join(kubbHome, 'cache'), { recursive: true })
    writeFileSync(join(kubbHome, 'cache', 'update-check.json'), JSON.stringify({ version: '99.0.0', checkedAt: Date.now() }))

    const lines = await bootstrap()

    expect(lines.some((line) => line.includes('v99.0.0'))).toBe(true)
    expect(lines.fetchCalls).toBe(0)
  })
})

describe('banner', () => {
  /** Stands in for the banner: it plays until `run` cuts it, then logs that it did. */
  function spyOnBanner() {
    return vi
      .spyOn(mascot, 'logBanner')
      .mockImplementation(({ signal }) => new Promise((resolve) => signal?.addEventListener('abort', () => resolve(console.log('banner cut')))))
  }

  it('cuts the banner once the config loads, before anything else prints', async () => {
    using _banner = spyOnBanner()
    const lines = await bootstrap()

    expect(lines[0]).toBe('banner cut')
    expect(lines).toContain('Loaded kubb.config.ts')
  })

  it('cuts the banner, then prints the error and exits with 1 when the config fails during it', async () => {
    using _banner = spyOnBanner()
    const lines = await bootstrap({ fail: true })

    expect(lines[0]).toBe('banner cut')
    expect(lines).toContain('✗ Config failed loading')
    expect(lines.at(-1)).toBe('exit 1')
  })
})

describe('reporters', () => {
  const config = {
    root: process.cwd(),
    input: './does-not-exist.yaml',
    output: { path: './gen', format: false, lint: false },
    adapter: adapterOas(),
    plugins: [],
  } satisfies UserConfig

  it('reports a failure for a config written without defineConfig', async () => {
    // `getConfigs` hands the exported object through as a `Config`, without `reporters`.
    const lines = await bootstrap({ configs: [config as unknown as Config] })

    expect(lines.some((line) => line.startsWith('✗ Generation failed') && line.includes('1 error'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })

  it('writes the run log to stderr, not stdout, when json owns stdout', async () => {
    const lines = await bootstrap({ configs: [config as unknown as Config], reporters: ['json'] })

    expect(lines.stdout).toStrictEqual([])
    expect(lines.some((line) => line.includes('Generation failed'))).toBe(true)
  })
})

describe('shared schemas', () => {
  it('reports what the adapter finds while parsing a spec for detection, and fails the run', async () => {
    const withRef = (name: string, ref: string) =>
      ({
        root: process.cwd(),
        input: {
          openapi: '3.0.3',
          info: { title: name, version: '1' },
          paths: {},
          components: { schemas: { Name: { type: 'string' }, Pet: { type: 'object', properties: { name: { $ref: ref } } } } },
        },
        output: { path: `./gen/${name}`, format: false, lint: false },
        shared: { path: './gen/common' },
        adapter: adapterOas(),
        plugins: [],
        storage: memoryStorage(),
      }) satisfies UserConfig as unknown as Config

    const lines = await bootstrap({ configs: [withRef('pets', '#/components/schemas/Name'), withRef('shop', '#/components/schemas/Missing')] })

    expect(lines.some((line) => line.includes(Diagnostics.code.refNotFound))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })

  it.each([
    [true, null],
    [false, 'stale'],
  ])('empties the shared directory once, before the first config that writes to it, when a later config sets output.clean: %s', async (clean, expected) => {
    const storage = memoryStorage()
    const shared = (file: string) => join(process.cwd(), 'gen', 'common', file)
    await storage.writeItem(shared('stale.ts'), 'stale')
    // Writes into the shared directory after the first config's clean, so a second clean would remove it.
    const writesShared = defineExtension({
      kind: 'plugin',
      meta: { name: 'writes-shared' },
      hooks: {
        async 'kubb:build:end'() {
          await storage.writeItem(shared('animals.ts'), 'animals')
        },
      },
    })()
    const configs = ['animals', 'fruits'].map(
      (name, index) =>
        ({
          root: process.cwd(),
          input: { openapi: '3.0.3', info: { title: name, version: '1' }, paths: {} },
          output: { path: `./gen/${name}`, clean: clean && index === 1, format: false, lint: false },
          shared: { path: './gen/common' },
          adapter: adapterOas(),
          plugins: index === 0 ? [writesShared] : [],
          storage,
        }) satisfies UserConfig as unknown as Config,
    )

    await bootstrap({ configs })

    expect(await storage.readItem(shared('stale.ts'))).toBe(expected)
    expect(await storage.readItem(shared('animals.ts'))).toBe('animals')
  })
})

describe('output passes', () => {
  const node = process.execPath
  const petStore = fileURLToPath(new URL('../../../../core/mocks/petStore.yaml', import.meta.url))
  const roots: Array<string> = []

  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
    }
  })

  /**
   * A config whose build succeeds in a temp root, so only `output.postGenerate` decides the outcome.
   */
  function withPostGenerate(postGenerate: Array<PostGenerateCommand>): Config {
    const root = mkdtempSync(join(tmpdir(), 'kubb-cli-run-'))
    roots.push(root)
    const config = {
      root,
      input: petStore,
      output: { path: './gen', format: false, lint: false, postGenerate },
      adapter: adapterOas(),
      plugins: [],
      storage: fsStorage(),
    } satisfies UserConfig

    return config as unknown as Config
  }

  it('runs the post-generate hooks from core and reports each one', async () => {
    const lines = await bootstrap({ configs: [withPostGenerate([{ name: 'types', command: `"${node}" -e "process.exit(0)"` }])] })

    expect(lines.some((line) => line.startsWith('✓ types in '))).toBe(true)
    expect(lines.some((line) => line.startsWith('Post-generate hooks completed in '))).toBe(true)
    expect(lines.some((line) => line.startsWith('✓ Generation complete'))).toBe(true)
    expect(lines.filter((line) => line.startsWith('exit '))).toStrictEqual([])
  })

  it('fails the run when a post-generate hook exits non-zero', async () => {
    const lines = await bootstrap({ configs: [withPostGenerate([{ name: 'types', command: `"${node}" -e "process.exit(1)"` }])] })

    expect(lines.some((line) => line.startsWith('✗ types failed (Hook execute failed: '))).toBe(true)
    expect(lines.some((line) => line.startsWith('error KUBB_POST_GENERATE_FAILED: Post-generate command failed: '))).toBe(true)
    expect(lines.some((line) => line.startsWith('✗ Generation failed') && line.includes('1 error'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })
})

describe('check', () => {
  const roots: Array<string> = []

  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
    }
  })

  // Unformatted on purpose: oxfmt rewrites both files, so the bytes on disk differ from what Kubb hands to the storage.
  const writesFiles = defineExtension({
    kind: 'plugin',
    meta: { name: 'writes-files' },
    hooks: {
      async 'kubb:plugins:end'({ config, upsertFile }) {
        for (const [name, source] of [
          ['pet.ts', 'export const pet = {name:"cat",   tags:[1,2]}'],
          ['types/index.ts', 'export type Pet = {name:string}'],
          // Not under `output.path`: a check must compare this one too, not write it.
          ['../client.ts', 'export const client = 1'],
          // Named by its real path, not through `output.path`, the way a plugin with a hard-coded folder does.
          [join(config.root, 'src/gen/fixed.ts'), 'export const fixed = 1'],
        ] as const) {
          await upsertFile(
            ast.factory.createFile({
              path: resolve(config.root, config.output.path, name),
              baseName: name.split('/').pop() as `${string}.ts`,
              sources: [ast.factory.createSource({ nodes: [ast.factory.createText(source)] })],
              imports: [],
              exports: [],
            }),
          )
        }
      },
    },
  })

  function project({ clean = false }: { clean?: boolean } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'kubb-cli-check-'))
    roots.push(root)
    const config = {
      root,
      input: { openapi: '3.0.3', info: { title: 'pets', version: '1' }, paths: {} },
      output: { path: './src/gen', clean, format: 'oxfmt', lint: false },
      adapter: adapterOas(),
      plugins: [writesFiles()],
    } satisfies UserConfig as unknown as Config
    const file = (name: string) => join(root, 'src/gen', name)
    // Every file under the root with its content, which also proves a check writes nothing.
    const snapshot = () =>
      Object.fromEntries(
        readdirSync(root, { recursive: true, withFileTypes: true })
          .filter((entry) => entry.isFile())
          .map((entry) => [join(entry.parentPath, entry.name), readFileSync(join(entry.parentPath, entry.name), 'utf8')]),
      )

    return { root, config, file, snapshot }
  }

  async function generated(options?: { clean?: boolean }) {
    const target = project(options)
    await bootstrap({ configs: [target.config] })
    expect(readFileSync(join(target.root, 'kubb-lock.yml'), 'utf8')).toContain('  src/gen/pet.ts:')
    // The formatter ran: the stored bytes are not the ones the plugin produced.
    expect(readFileSync(target.file('pet.ts'), 'utf8')).toContain('name: "cat"')

    return target
  }

  it('exits 0 for formatted output that is up to date, from kubb-lock.yml alone', async () => {
    const { config, snapshot } = await generated()
    const before = snapshot()

    const lines = await bootstrap({ configs: [config], check: true })

    expect(lines.some((line) => line.startsWith('✓ Generated code is up to date'))).toBe(true)
    expect(lines.some((line) => line.includes('4 files checked'))).toBe(true)
    expect(lines.some((line) => line.includes('Out-of-date files'))).toBe(false)
    expect(lines.some((line) => line.includes('to update them'))).toBe(false)
    expect(lines.filter((line) => line.startsWith('exit '))).toStrictEqual([])
    expect(snapshot()).toStrictEqual(before)
  })

  it('reports formatted output as unchanged in a dry run, from kubb-lock.yml alone', async () => {
    const { config, snapshot } = await generated()
    const before = snapshot()

    const lines = await bootstrap({ configs: [config], dryRun: true })

    expect(lines.some((line) => line.includes('0 files planned · 4 unchanged'))).toBe(true)
    expect(snapshot()).toStrictEqual(before)
  })

  it('exits 1 and lists an edited file as modified, a missing file as added, and leaves the output as it was', async () => {
    const { config, file, snapshot } = await generated()
    writeFileSync(file('pet.ts'), 'export const pet = { name: "dog", tags: [1, 2] };\n')
    rmSync(file('types/index.ts'))
    const before = snapshot()

    const lines = await bootstrap({ configs: [config], check: true })

    expect(lines.some((line) => line.startsWith('✗ Generated code is out of date'))).toBe(true)
    expect(lines.some((line) => line.includes('modified  src/gen/pet.ts          +1 −1'))).toBe(true)
    expect(lines.some((line) => line.includes('Run `kubb generate` to update them.'))).toBe(true)
    expect(lines.some((line) => line.includes('added     src/gen/types/index.ts  +1 −0'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
    expect(snapshot()).toStrictEqual(before)
  })

  it('lists a file only on disk as deleted when output.clean is on, and ignores it otherwise', async () => {
    const cleaned = await generated({ clean: true })
    writeFileSync(cleaned.file('extra.ts'), 'export {}\n')

    const lines = await bootstrap({ configs: [cleaned.config], check: true })

    expect(lines.some((line) => line.includes('1 file out of date'))).toBe(true)
    expect(lines.some((line) => line.includes('src/gen/fixed.ts  '))).toBe(false)
    expect(lines.some((line) => line.includes('deleted   src/gen/extra.ts  +0 −1'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')

    const kept = await generated()
    writeFileSync(kept.file('extra.ts'), 'export {}\n')

    expect((await bootstrap({ configs: [kept.config], check: true })).filter((line) => line.startsWith('exit '))).toStrictEqual([])
  })

  it('exits 0 when the linter config ignores every path outside src', async () => {
    const target = project()
    // Lints `src/` only: a pass over any folder outside it finds no files and fails.
    writeFileSync(join(target.root, '.oxlintrc.json'), JSON.stringify({ ignorePatterns: ['**/*', '!src/**/*'] }))
    const config = { ...target.config, output: { ...target.config.output, lint: 'oxlint' } } as Config
    await bootstrap({ configs: [config] })
    const before = target.snapshot()

    const lines = await bootstrap({ configs: [config], check: true })

    expect(lines.some((line) => line.startsWith('✓ Generated code is up to date'))).toBe(true)
    expect(lines.filter((line) => line.startsWith('exit '))).toStrictEqual([])
    expect(target.snapshot()).toStrictEqual(before)
  })

  it('exits 1 and names kubb-lock.yml when formatted output has no lockfile', async () => {
    const { config, root } = await generated()
    rmSync(join(root, 'kubb-lock.yml'))

    const lines = await bootstrap({ configs: [config], check: true })

    expect(lines.some((line) => line.includes('No readable kubb-lock.yml found. Run `kubb generate` and commit kubb-lock.yml'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 1')
  })

  it('keeps the missing kubb-lock.yml warning out of stdout for the json reporter', async () => {
    const { config, root } = await generated()
    rmSync(join(root, 'kubb-lock.yml'))
    using _stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    const lines = await bootstrap({ configs: [config], check: true, reporters: ['json'] })

    expect(lines.some((line) => line.includes('No readable kubb-lock.yml found'))).toBe(true)
    expect(lines.stdout.some((line) => line.includes('No readable kubb-lock.yml found'))).toBe(false)
  })

  describe('reuse', () => {
    const upToDate = (lines: Array<string>) =>
      lines.some((line) => line.includes('Up to date: the config, the spec, and the installed packages match kubb-lock.yml'))

    async function fromSpecFile() {
      const target = project()
      const spec = join(target.root, 'openapi.json')
      writeFileSync(spec, JSON.stringify(target.config.input))
      writeFileSync(join(target.root, 'package.json'), '{}')
      const config = (output: Partial<Config['output']> = {}) =>
        ({ ...target.config, input: spec, adapter: adapterOas(), plugins: [writesFiles()], output: { ...target.config.output, ...output } }) as Config
      await bootstrap({ configs: [config()] })

      return { ...target, config, spec }
    }

    it('skips the build when the config, the spec and the output match kubb-lock.yml', async () => {
      const { config, snapshot } = await fromSpecFile()
      const before = snapshot()

      const lines = await bootstrap({ configs: [config()] })

      expect(upToDate(lines)).toBe(true)
      expect(snapshot()).toStrictEqual(before)
    })

    it.each([
      ['--force is passed', () => ({ force: true })],
      [
        'the spec changed',
        ({ spec }: { spec: string }) => void writeFileSync(spec, JSON.stringify({ openapi: '3.0.3', info: { title: 'pets', version: '2' }, paths: {} })),
      ],
      ['another reporter needs the results', () => ({ reporters: ['cli', 'json'] as Array<'cli' | 'json'> })],
    ])('generates again when %s', async (_name, change) => {
      const target = await fromSpecFile()
      const options = change(target) ?? {}
      // The `json` reporter prints its report to stdout.
      using _stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

      const lines = await bootstrap({ configs: [target.config()], ...options })

      expect(upToDate(lines)).toBe(false)
      expect(readFileSync(target.file('pet.ts'), 'utf8')).toContain('name: "cat"')
    })
  })

  it('prints a hunk for the edited file with --diff', async () => {
    const { config, file } = await generated()
    writeFileSync(file('pet.ts'), 'export const pet = { name: "dog", tags: [1, 2] };\n')

    const lines = await bootstrap({ configs: [config], check: true, diff: true })
    const patch = lines.find((line) => line.includes('--- a/src/gen/pet.ts'))

    expect(patch).toContain('@@ -1,1 +1,1 @@')
    expect(patch).toContain('-export const pet = { name: "dog", tags: [1, 2] };')
    // No formatter runs in a check, so the new side is the code as Kubb generates it.
    expect(patch).toContain('+export const pet = {name:"cat",   tags:[1,2]}')
    expect(lines.at(-1)).toBe('exit 1')
  })

  it('compares a file a plugin writes outside output.path instead of writing it', async () => {
    const { config, root, snapshot } = await generated()
    rmSync(join(root, 'src/client.ts'))
    const before = snapshot()

    const lines = await bootstrap({ configs: [config], check: true })

    expect(lines.some((line) => line.includes('added     src/client.ts  +1 −0'))).toBe(true)
    expect(snapshot()).toStrictEqual(before)
  })

  it('keeps the report of each config when two configs share an output folder', async () => {
    const { config } = await generated()
    using stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await bootstrap({ configs: ['first', 'second'].map((name) => ({ ...config, name })), check: true, reporters: ['json'] })

    expect(JSON.parse(String(stdout.mock.calls.at(-1)?.[0]))).toMatchObject([
      { name: 'first', check: { changed: false } },
      { name: 'second', check: { changed: false } },
    ])
  })

  it('adds the files and the check outcome to the json report', async () => {
    const { config, file } = await generated()
    writeFileSync(file('pet.ts'), 'export const pet = { name: "dog", tags: [1, 2] };\n')
    using stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await bootstrap({ configs: [config], check: true, reporters: ['json'] })

    expect(JSON.parse(String(stdout.mock.calls.at(-1)?.[0]))).toMatchObject([
      { check: { changed: true, files: [{ path: 'src/gen/pet.ts', status: 'modified', linesAdded: 1, linesRemoved: 1 }] } },
    ])
  })

  it('exits 2 and writes nothing for a storage other than fs', async () => {
    const { config, root } = project()

    const lines = await bootstrap({ configs: [{ ...config, storage: memoryStorage() } as Config], check: true })

    expect(lines.some((line) => line.includes('--check compares files on disk, but this config uses the "memory" storage.'))).toBe(true)
    expect(lines.at(-1)).toBe('exit 2')
    expect(readdirSync(root)).toStrictEqual([])
  })

  it('exits 2 when generation fails, and when --watch is passed too', async () => {
    const { config } = project()
    const failed = await bootstrap({ configs: [{ ...config, input: './missing.yaml' } as Config], check: true })

    expect(failed.at(-1)).toBe('exit 2')

    using _error = vi.spyOn(console, 'error').mockImplementation(() => {})
    using _exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`)
    }) as never)
    await expect(run({ logLevel: 'info', watch: true, check: true })).rejects.toThrow('exit 2')
  })
})
