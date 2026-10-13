import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registryEntry, stubFetch } from '../../utils/registryFixture.ts'
import { installPackages } from '../init/utils.ts'
import { run } from './run.ts'

vi.mock('../init/utils.ts', () => ({
  detectPackageManager: vi.fn(() => ({ name: 'pnpm', lockFiles: [], initCommand: [], installCommand: ['add', '-D'] })),
  installPackages: vi.fn(async () => {}),
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
  process.exitCode = undefined
  await rm(cwd, { recursive: true, force: true })
})

describe('kubb add', () => {
  it('installs the pinned version and adds the plugin to the config', async () => {
    stubFetch({ body: pluginX })

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(globalThis.fetch).toHaveBeenCalledWith('https://kubb.dev/registry/acme/plugin-x.json', expect.anything())
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x@1.2.0'], expect.objectContaining({ name: 'pnpm' }), cwd)
    const config = await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')
    expect(config).toContain(`import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(config).toContain('plugins: [pluginX()]')
    expect(process.exitCode).toBeUndefined()
  })

  it('installs a GitHub release from its commit and imports it by package name', async () => {
    const commit = '0123456789abcdef0123456789abcdef01234567'
    stubFetch({ body: { ...pluginX, artifact: { ...pluginX.artifact, kind: 'github', owner: 'acme', repo: 'kubb-plugin-x', tag: 'v1.2.0', commit } } })

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(installPackages).toHaveBeenCalledWith([`github:acme/kubb-plugin-x#${commit}`], expect.objectContaining({ name: 'pnpm' }), cwd)
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain(`import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(process.exitCode).toBeUndefined()
  })

  it('prints the snippet for an adapter instead of editing the config', async () => {
    stubFetch({ body: registryEntry({ name: 'adapter-x', version: '1.2.0', kind: 'adapter', manifest: { export: 'adapterX' } }) })

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
    stubFetch({ body: { ...pluginX, manifest: { ...pluginX.manifest, compatibility: { kubb: '>=99.0.0' } } } })

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toMatch(/"plugin-x" requires Kubb >=99\.0\.0/)
    expect(process.exitCode).toBe(1)
  })

  it('names the id and the registry when the extension is unknown', async () => {
    stubFetch({ status: 404 })

    await run({ id: 'plugin-missing', yes: true, install: true })

    expect(output.join('\n')).toContain('"kubb-labs/plugin-missing" is not in the registry at https://kubb.dev/registry.')
    expect(process.exitCode).toBe(1)
  })

  it.each([
    ['an id with another shape', '../etc/passwd', 'is not a registry id'],
    ['a package name that is not one', 'acme/plugin-x', 'sent an invalid entry'],
  ])('refuses %s before installing', async (_label, id, message) => {
    stubFetch({ body: { ...pluginX, artifact: { kind: 'npm', package: '--registry=https://evil.test', version: '1.2.0' } } })

    await run({ id, yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toContain(message)
  })
})
