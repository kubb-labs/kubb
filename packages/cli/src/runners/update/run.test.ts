import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import * as clack from '@clack/prompts'
import type { FileNode } from '@kubb/ast'
import { fsStorage } from '@kubb/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject, registryEntry, registryIndex, stubFetch } from '../../utils/registryFixture.ts'
import { generate } from '../generate/run.ts'
import { installPackages } from '../init/utils.ts'
import { run } from './run.ts'

vi.mock('../init/utils.ts', () => ({
  detectPackageManager: vi.fn(async () => ({ name: 'npm', agent: 'npm' })),
  installPackages: vi.fn(async () => {}),
}))
vi.mock('../generate/run.ts', () => ({ generate: vi.fn(async () => true) }))
vi.mock('@clack/prompts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@clack/prompts')>()),
  multiselect: vi.fn(async () => ['acme/plugin-x']),
  confirm: vi.fn(async () => true),
}))

const pluginX = registryEntry({ name: 'plugin-x', version: '1.1.0' })
const pluginY = registryEntry({ name: 'plugin-y', version: '2.0.0' })
const pluginZ = registryEntry({ name: 'plugin-z', version: '2.0.0' })

let cwd: string
let output: Array<string>

beforeEach(async () => {
  cwd = await createProject({
    '@acme/kubb-plugin-x': { version: '1.0.0' },
    '@acme/kubb-plugin-y': { version: '2.0.0' },
    '@acme/kubb-plugin-z': { version: '1.0.0' },
    'left-pad': { version: '1.0.0' },
  })
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  output = []
  for (const method of ['log', 'warn', 'error'] as const)
    vi.spyOn(console, method).mockImplementation((...args) => void output.push(stripVTControlCharacters(args.join(' '))))
  stubFetch({ body: registryIndex([pluginX, pluginY, pluginZ]) })
  process.exitCode = undefined
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(installPackages).mockClear()
  vi.mocked(clack.multiselect).mockClear()
  vi.mocked(generate).mockClear()
  process.exitCode = undefined
  await rm(cwd, { recursive: true, force: true })
})

describe('kubb update', () => {
  it('lists the updates with --dry-run, counts the majors, and installs nothing', async () => {
    await run({ ids: [], dryRun: true, yes: false })

    const printed = output.join('\n')
    expect(printed).toContain('◇ Updates available')
    expect(printed).toMatch(/@acme\/kubb-plugin-x +1\.0\.0 +1\.1\.0 +minor/)
    expect(printed).toMatch(/@acme\/kubb-plugin-z +1\.0\.0 +2\.0\.0 +major · breaking/)
    expect(printed).toContain('Dry run: nothing was installed. Run kubb update to install them.')
    expect(clack.multiselect).not.toHaveBeenCalled()
    expect(installPackages).not.toHaveBeenCalled()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(process.exitCode).toBeUndefined()
  })

  it('pre-selects the minors and leaves a major unselected with its headline change and guide', async () => {
    await run({ ids: [], dryRun: false, yes: false })

    expect(clack.multiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { value: 'acme/plugin-x', label: '@acme/kubb-plugin-x', hint: '1.0.0 → 1.1.0' },
          { value: 'acme/plugin-z', label: '@acme/kubb-plugin-z', hint: '1.0.0 → 2.0.0' },
        ],
        initialValues: ['acme/plugin-x'],
      }),
    )
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x@1.1.0'], expect.objectContaining({ name: 'npm' }), cwd, expect.any(Function))
    expect(output.join('\n')).toContain('Skipped  Plugin @acme/kubb-plugin-z 2.0.0  run kubb update acme/plugin-z later')
  })

  it('installs only the non-major updates with --yes', async () => {
    await run({ ids: [], dryRun: false, yes: true })

    expect(clack.multiselect).not.toHaveBeenCalled()
    expect(clack.confirm).not.toHaveBeenCalled()
    expect(generate).not.toHaveBeenCalled()
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x@1.1.0'], expect.anything(), cwd, expect.any(Function))
    expect(output.join('\n')).toContain('✓ Update complete')
    expect(output.join('\n')).toContain('Packages  1 installed with npm')
    expect(output.join('\n')).toContain('Regeneration not run')
  })

  it('regenerates in this process after the install and lists the changed files', async () => {
    const gen = path.join(cwd, 'gen')
    await mkdir(gen)
    await writeFile(path.join(gen, 'kept.ts'), 'same')
    await writeFile(path.join(gen, 'changed.ts'), 'old')
    await writeFile(path.join(gen, 'removed.ts'), 'old')
    await writeFile(
      path.join(cwd, 'kubb.config.ts'),
      `export default { root: ${JSON.stringify(cwd)}, input: './spec.yaml', output: { path: './gen', clean: true } }\n`,
    )
    // Writes the way core does, with the hooks the reporters read the changes from.
    vi.mocked(generate).mockImplementationOnce(async ({ config: loaded, hooks }) => {
      const config = { ...loaded, storage: fsStorage() }
      await hooks.callHook('kubb:generation:start', { config })
      await writeFile(path.join(gen, 'changed.ts'), 'new')
      await writeFile(path.join(gen, 'added.ts'), 'new')
      await rm(path.join(gen, 'removed.ts'))
      const files = ['kept.ts', 'changed.ts', 'added.ts'].map((name) => ({ path: path.join(gen, name) }) as FileNode)
      await hooks.callHook('kubb:files:processing:end', { files, unchanged: [] })
      await hooks.callHook('kubb:generation:end', { config, storage: config.storage, status: 'success' })
      return true
    })

    await run({ ids: [], dryRun: false, yes: false })

    expect(generate).toHaveBeenCalledTimes(1)
    const printed = output.join('\n')
    expect(printed).toContain('Generated: 3 files changed')
    expect(printed).toContain('Files     1 added · 1 modified · 1 deleted')
    expect(printed).not.toContain('Regeneration not run')
    expect(printed).not.toContain('A gen/added.ts')
    expect(await readFile(path.join(gen, 'kept.ts'), 'utf8')).toBe('same')
  })

  it('installs a newer GitHub release from its commit', async () => {
    const commit = '0123456789abcdef0123456789abcdef01234567'
    const artifact = { kind: 'github', owner: 'acme', repo: 'kubb-plugin-x', tag: 'v1.1.0', commit }
    stubFetch({ body: registryIndex([registryEntry({ name: 'plugin-x', version: '1.1.0', artifact })]) })

    await run({ ids: [], dryRun: false, yes: true })

    expect(installPackages).toHaveBeenCalledWith([`github:acme/kubb-plugin-x#${commit}`], expect.objectContaining({ name: 'npm' }), cwd, expect.any(Function))
  })

  it('installs a major with --yes when its id is named', async () => {
    await run({ ids: ['acme/plugin-z'], dryRun: false, yes: true })

    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-z@2.0.0'], expect.anything(), cwd, expect.any(Function))
  })

  it('only updates the ids it is given', async () => {
    await run({ ids: ['acme/plugin-y'], dryRun: false, yes: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toContain('1 of 1 up to date')
    expect(output.join('\n')).toContain('No updates for acme/plugin-y.')
  })

  it('exits with code 1 when a named extension is not installed', async () => {
    await run({ ids: ['acme/plugin-missing'], dryRun: false, yes: true })

    expect(output.join('\n')).toContain('acme/plugin-missing is not installed, or not in the registry.')
    expect(installPackages).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('exits with code 1 when a named update needs a newer Kubb', async () => {
    stubFetch({ body: registryIndex([registryEntry({ name: 'plugin-x', version: '1.1.0', manifest: { compatibility: { kubb: '>=999.0.0' } } })]) })

    await run({ ids: ['acme/plugin-x'], dryRun: false, yes: true })

    expect(output.join('\n')).toContain('Skipped acme/plugin-x: "plugin-x" requires Kubb >=999.0.0')
    expect(installPackages).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })
})
