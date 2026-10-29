import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as clack from '@clack/prompts'
import { registryEntry, registryIndex, stubFetch } from '../../utils/registryFixture.ts'
import { installPackages } from '../init/utils.ts'
import { run } from './run.ts'
import { extensionKinds } from '@internals/shared'

vi.mock('../init/utils.ts', () => ({
  detectPackageManager: vi.fn(async () => ({ name: 'pnpm', agent: 'pnpm' })),
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
  for (const method of ['log', 'warn', 'error'] as const)
    vi.spyOn(console, method).mockImplementation((...args) => void output.push(stripVTControlCharacters(args.join(' '))))
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
    stubFetch({ body: registryIndex([pluginX]) })

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(vi.mocked(globalThis.fetch).mock.calls.map(([url]) => url)).toStrictEqual(['https://kubb.dev/registry/index.json'])
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x@1.2.0'], expect.objectContaining({ name: 'pnpm' }), cwd, expect.any(Function))
    const config = await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')
    expect(config).toContain(`import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(config).toContain('plugins: [pluginX()]')
    expect(output.join('\n')).toContain('✓ Plugin ready')
    expect(output.join('\n')).toContain('Packages  1 installed with pnpm')
    expect(output.join('\n')).toContain('Next     kubb generate')
    const summary = output.join('\n').split('✓ Plugin ready')[1]!
    expect(summary).toContain('+ pluginX()')
    expect(summary).not.toContain('export default')
    expect(output.join('\n')).toContain('Options  kubb.dev/extensions/acme/plugin-x')
    expect(process.exitCode).toBeUndefined()
  })

  it('previews the packages and the exact config lines before asking', async () => {
    stubFetch({ body: registryIndex([pluginX]) })

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
      kind: extensionKinds.adapter,
      manifest: { displayName: 'Adapter X', description: 'Reads X files.' },
    })
    stubFetch({ body: registryIndex([adapterX, pluginX]) })
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

  it.each([
    {
      label: 'adds both with --yes',
      yes: true,
      answer: true,
      installs: ['@acme/kubb-plugin-ts@5.0.0', '@acme/kubb-plugin-zod@5.2.0'],
      plugins: 'plugins: [pluginTs(), pluginZod()]',
    },
    { label: 'adds only the extension when told to', yes: false, answer: false, installs: ['@acme/kubb-plugin-zod@5.2.0'], plugins: 'plugins: [pluginZod()]' },
  ])('$label when a required plugin is missing from the config', async ({ yes, answer, installs, plugins }) => {
    stubFetch({ body: registryIndex([pluginTs, pluginZod]) })
    if (!yes) vi.mocked(clack.select).mockResolvedValueOnce(answer)

    await run({ id: 'plugin-zod', yes, install: true })

    expect(vi.mocked(clack.select).mock.calls.length).toBe(yes ? 0 : 1)
    expect(installPackages).toHaveBeenCalledWith(installs, expect.anything(), cwd, expect.any(Function))
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain(plugins)
    if (!answer) expect(output.join('\n')).toContain('Plugin configured; dependencies missing')
  })

  it('suggests the closest id for a typo and links the registry', async () => {
    stubFetch({ body: registryIndex([pluginTs, pluginZod, pluginX]) })

    await run({ id: 'zod-plugin', yes: true, install: true })

    const printed = output.join('\n')
    expect(printed).toContain('✗ No extension named zod-plugin')
    expect(printed).toContain('  kubb add plugin-zod')
    expect(printed).toContain('Browse all  kubb.dev/extensions')
    expect(installPackages).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('installs a GitHub release from its commit and imports it by package name', async () => {
    const commit = '0123456789abcdef0123456789abcdef01234567'
    stubFetch({
      body: registryIndex([{ ...pluginX, artifact: { ...pluginX.artifact, kind: 'github', owner: 'acme', repo: 'kubb-plugin-x', tag: 'v1.2.0', commit } }]),
    })

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(installPackages).toHaveBeenCalledWith([`github:acme/kubb-plugin-x#${commit}`], expect.objectContaining({ name: 'pnpm' }), cwd, expect.any(Function))
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain(`import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(process.exitCode).toBeUndefined()
  })

  it('exits with code 1 when a plugin was installed but could not be written into the config', async () => {
    await writeFile(path.join(cwd, 'kubb.config.ts'), configSource.replace('plugins: []', 'plugins: getPlugins()'))
    stubFetch({ body: registryIndex([pluginX]) })

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(output.join('\n')).toContain('! Plugin needs configuration')
    expect(process.exitCode).toBe(1)
  })

  it('prints the snippet for an adapter instead of editing the config', async () => {
    stubFetch({ body: registryIndex([registryEntry({ name: 'adapter-x', version: '1.2.0', kind: extensionKinds.adapter, manifest: { export: 'adapterX' } })]) })

    await run({ id: 'acme/adapter-x', yes: true, install: false })

    const printed = output.join('\n')
    expect(installPackages).not.toHaveBeenCalled()
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toBe(configSource)
    expect(printed).toContain(`import { adapterX } from '@acme/kubb-adapter-x'\n\nadapter: adapterX(),`)
    expect(printed).not.toContain('export default defineConfig(')
    expect(printed).toContain('! Adapter needs configuration')
    expect(printed).toContain('Install @acme/kubb-adapter-x@1.2.0 to use it.')
    expect(printed).toContain('Add the snippet above, then run kubb generate.')
  })

  it('refuses a parser before installing it when there is no config', async () => {
    await rm(path.join(cwd, 'kubb.config.ts'))
    stubFetch({
      body: registryIndex([registryEntry({ name: 'parser-yaml', version: '1.2.0', kind: extensionKinds.parser, manifest: { export: 'parserYaml' } })]),
    })

    await run({ id: 'acme/parser-yaml', yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('writes a parser into the config with the default parsers, and installs those at the project kubb version', async () => {
    await mkdir(path.join(cwd, 'node_modules', 'kubb'), { recursive: true })
    await writeFile(path.join(cwd, 'node_modules', 'kubb', 'package.json'), JSON.stringify({ name: 'kubb', version: '5.13.0' }))
    await writeFile(path.join(cwd, 'package.json'), JSON.stringify({ devDependencies: { kubb: '^5.13.0' } }))
    stubFetch({
      body: registryIndex([registryEntry({ name: 'parser-yaml', version: '1.2.0', kind: extensionKinds.parser, manifest: { export: 'parserYaml' } })]),
    })

    await run({ id: 'acme/parser-yaml', yes: true, install: true })

    expect(installPackages).toHaveBeenCalledWith(
      ['@acme/kubb-parser-yaml@1.2.0', '@kubb/parser-ts@5.13.0', '@kubb/parser-md@5.13.0'],
      expect.objectContaining({ name: 'pnpm' }),
      cwd,
      expect.any(Function),
    )
    const config = await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')
    expect(config).toContain(`import { parserTs, parserTsx } from '@kubb/parser-ts'`)
    expect(config).toContain('parsers: [parserTs(), parserTsx(), parserMd(), parserYaml()],')
    expect(process.exitCode).toBeUndefined()
  })

  it('appends a parser to the parsers the config lists, without installing the defaults', async () => {
    await writeFile(
      path.join(cwd, 'kubb.config.ts'),
      `import { parserTs } from '@kubb/parser-ts'\n${configSource.replace('plugins: []', 'parsers: [parserTs()],\n  plugins: []')}`,
    )
    stubFetch({
      body: registryIndex([registryEntry({ name: 'parser-yaml', version: '1.2.0', kind: extensionKinds.parser, manifest: { export: 'parserYaml' } })]),
    })

    await run({ id: 'acme/parser-yaml', yes: true, install: true })

    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-parser-yaml@1.2.0'], expect.objectContaining({ name: 'pnpm' }), cwd, expect.any(Function))
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain('parsers: [parserTs(), parserYaml()],')
  })

  it('refuses an extension that needs another Kubb version', async () => {
    stubFetch({ body: registryIndex([{ ...pluginX, manifest: { ...pluginX.manifest, compatibility: { kubb: '>=99.0.0' } } }]) })

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toMatch(/"plugin-x" requires Kubb >=99\.0\.0/)
    expect(process.exitCode).toBe(1)
  })

  it.each([
    ['an id with another shape', '../etc/passwd', 'is not a registry id'],
    ['a package name that is not one', 'acme/plugin-x', 'No extension named acme/plugin-x'],
    ['no id with --yes', undefined, 'Pass a registry id, such as plugin-zod, when using --yes.'],
  ])('refuses %s before installing', async (_label, id, message) => {
    stubFetch({ body: registryIndex([{ ...pluginX, artifact: { kind: 'npm', package: '--registry=https://evil.test', version: '1.2.0' } }]) })

    await run({ id, yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toContain(message)
  })
})
