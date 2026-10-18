import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as clack from '@clack/prompts'
import { registryEntry, stubRegistry } from '../../utils/registryFixture.ts'
import { installPackages } from '../init/utils.ts'
import { run, summarize } from './run.ts'

vi.mock('../init/utils.ts', () => ({
  detectPackageManager: vi.fn(() => ({ name: 'pnpm', lockFiles: [], initCommand: [], installCommand: ['add', '-D'] })),
  installPackages: vi.fn(async () => {}),
}))
vi.mock('@clack/prompts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@clack/prompts')>()),
  autocomplete: vi.fn(async () => 'acme/plugin-x'),
  confirm: vi.fn(async () => true),
  select: vi.fn(async () => true),
}))

const configSource = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './petStore.yaml',\n  plugins: [],\n})\n`

const pluginX = registryEntry({ name: 'plugin-x', version: '1.2.0', manifest: { export: 'pluginX' } })

let cwd: string
let output: Array<string>

beforeEach(async () => {
  cwd = await mkdtemp(path.join(tmpdir(), 'kubb-add-'))
  await writeFile(path.join(cwd, 'kubb.config.ts'), configSource)
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  output = []
  for (const method of ['log', 'warn', 'error'] as const) vi.spyOn(console, method).mockImplementation((...args) => void output.push(args.join(' ')))
  process.exitCode = undefined
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(installPackages).mockClear()
  vi.mocked(clack.select).mockClear()
  vi.mocked(clack.confirm).mockClear()
  vi.mocked(clack.autocomplete).mockClear()
  process.exitCode = undefined
  await rm(cwd, { recursive: true, force: true })
})

const pluginTs = { ...registryEntry({ name: 'plugin-ts', version: '5.0.0', manifest: { export: 'pluginTs' } }), id: 'kubb-labs/plugin-ts' }
const pluginZod = {
  ...registryEntry({
    name: 'plugin-zod',
    version: '5.2.0',
    manifest: { export: 'pluginZod', description: 'Zod schemas from your spec', dependencies: ['plugin-ts'] },
  }),
  id: 'kubb-labs/plugin-zod',
}

describe('kubb add', () => {
  it('installs the pinned version and adds the plugin to the config, reading the index once', async () => {
    stubRegistry([pluginX])

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(vi.mocked(globalThis.fetch).mock.calls.map(([url]) => url)).toStrictEqual(['https://kubb.dev/registry/index.json'])
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x@1.2.0'], expect.objectContaining({ name: 'pnpm' }), cwd)
    const config = await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')
    expect(config).toContain(`import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(config).toContain('plugins: [pluginX()]')
    expect(output.join('\n')).toContain('✓ plugin-x is ready')
    expect(output.join('\n')).toContain('Options  kubb.dev/extensions/acme/plugin-x')
    expect(process.exitCode).toBeUndefined()
  })

  it('previews the packages and the exact config lines before asking', async () => {
    stubRegistry([pluginX])

    await run({ id: 'acme/plugin-x', yes: false, install: true })

    const printed = output.join('\n')
    expect(printed).toContain('plugin-x v1.2.0 · An extension')
    expect(printed).toContain('Installs  @acme/kubb-plugin-x@1.2.0')
    expect(printed).toContain('Config    kubb.config.ts')
    expect(printed).toContain(`  + import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(printed).toContain('  + plugins: [pluginX()],')
    expect(clack.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: 'Add it?' }))
  })

  it('searches the registry in memory, marking installed extensions as not selectable', async () => {
    const adapterX = registryEntry({
      name: 'adapter-x',
      version: '2.0.0',
      kind: 'adapter',
      manifest: { displayName: 'Adapter X', description: 'Reads X files.' },
    })
    stubRegistry([adapterX, pluginX])
    await writeFile(path.join(cwd, 'package.json'), JSON.stringify({ devDependencies: { '@acme/kubb-adapter-x': '^2.0.0' } }))

    await run({ yes: false, install: false })

    const prompt = vi.mocked(clack.autocomplete).mock.calls[0]![0]
    const adapter = { value: 'acme/adapter-x', label: 'acme/adapter-x', hint: 'installed', disabled: true }
    expect(prompt.message).toBe('Add an extension · 2 in the registry')
    expect(prompt.options).toStrictEqual([adapter, { value: 'acme/plugin-x', label: 'acme/plugin-x', hint: 'An extension', disabled: false }])
    expect(prompt.filter!('x files', adapter)).toBe(true)
    expect(prompt.filter!('plugin-x', adapter)).toBe(false)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain('plugins: [pluginX()]')
  })

  it('shows a required plugin already in the config as installed', async () => {
    stubRegistry([pluginTs, pluginZod])
    await writeFile(path.join(cwd, 'kubb.config.ts'), configSource.replace('plugins: []', 'plugins: [pluginTs()]'))

    await run({ id: 'plugin-zod', yes: true, install: true })

    expect(output.join('\n')).toContain('Needs     plugin-ts ✓ installed')
    expect(clack.select).not.toHaveBeenCalled()
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-zod@5.2.0'], expect.anything(), cwd)
  })

  it.each([
    {
      label: 'adds both with --yes',
      yes: true,
      answer: true,
      installs: ['@acme/kubb-plugin-ts@5.0.0', '@acme/kubb-plugin-zod@5.2.0'],
      plugins: 'plugins: [pluginTs(), pluginZod()]',
    },
    {
      label: 'adds both when asked',
      yes: false,
      answer: true,
      installs: ['@acme/kubb-plugin-ts@5.0.0', '@acme/kubb-plugin-zod@5.2.0'],
      plugins: 'plugins: [pluginTs(), pluginZod()]',
    },
    { label: 'adds only the extension when told to', yes: false, answer: false, installs: ['@acme/kubb-plugin-zod@5.2.0'], plugins: 'plugins: [pluginZod()]' },
  ])('$label when a required plugin is missing from the config', async ({ yes, answer, installs, plugins }) => {
    stubRegistry([pluginTs, pluginZod])
    if (!yes) vi.mocked(clack.select).mockResolvedValueOnce(answer)

    await run({ id: 'plugin-zod', yes, install: true })

    expect(vi.mocked(clack.select).mock.calls.length).toBe(yes ? 0 : 1)
    expect(installPackages).toHaveBeenCalledWith(installs, expect.anything(), cwd)
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain(plugins)
  })

  it('suggests the closest id for a typo and links the registry', async () => {
    stubRegistry([pluginTs, pluginZod, pluginX])

    await run({ id: 'zod-plugin', yes: true, install: true })

    const printed = output.join('\n')
    expect(printed).toContain('No extension named zod-plugin in the registry')
    expect(printed).toContain('Did you mean plugin-zod?')
    expect(printed).toContain('  kubb add plugin-zod')
    expect(printed).toContain('Browse all  kubb.dev/extensions')
    expect(installPackages).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('installs a GitHub release from its commit and imports it by package name', async () => {
    const commit = '0123456789abcdef0123456789abcdef01234567'
    stubRegistry([{ ...pluginX, artifact: { ...pluginX.artifact, kind: 'github', owner: 'acme', repo: 'kubb-plugin-x', tag: 'v1.2.0', commit } }])

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(installPackages).toHaveBeenCalledWith([`github:acme/kubb-plugin-x#${commit}`], expect.objectContaining({ name: 'pnpm' }), cwd)
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain(`import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(process.exitCode).toBeUndefined()
  })

  it('prints the snippet for an adapter instead of editing the config', async () => {
    stubRegistry([registryEntry({ name: 'adapter-x', version: '1.2.0', kind: 'adapter', manifest: { export: 'adapterX' } })])

    await run({ id: 'acme/adapter-x', yes: true, install: false })

    const printed = output.join('\n')
    expect(installPackages).not.toHaveBeenCalled()
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toBe(configSource)
    expect(printed).toContain(`import { adapterX } from '@acme/kubb-adapter-x'\n\nadapter: adapterX(),`)
    expect(printed).not.toContain('export default defineConfig(')
    expect(printed).toContain('Install @acme/kubb-adapter-x@1.2.0 and add the snippet above.')
    expect(printed).not.toContain('Added @acme/kubb-adapter-x')
  })

  it('refuses an extension that needs another Kubb version', async () => {
    stubRegistry([{ ...pluginX, manifest: { ...pluginX.manifest, compatibility: { kubb: '>=99.0.0' } } }])

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toMatch(/"plugin-x" requires Kubb >=99\.0\.0/)
    expect(process.exitCode).toBe(1)
  })

  it.each([
    ['an id with another shape', '../etc/passwd', 'is not a registry id'],
    ['a package name that is not one', 'acme/plugin-x', 'No extension named acme/plugin-x in the registry'],
    ['no id with --yes', undefined, 'Pass a registry id, such as plugin-zod, when using --yes.'],
  ])('refuses %s before installing', async (_label, id, message) => {
    stubRegistry([{ ...pluginX, artifact: { kind: 'npm', package: '--registry=https://evil.test', version: '1.2.0' } }])

    await run({ id, yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toContain(message)
  })
})

describe('summarize', () => {
  it('keeps the first sentence and cuts it to one line', () => {
    expect(summarize('Zod schemas from your spec. More detail follows.')).toBe('Zod schemas from your spec')
    expect(summarize('Generates MSW request handlers from your OpenAPI spec so you can mock the API in tests.')).toHaveLength(64)
  })
})
