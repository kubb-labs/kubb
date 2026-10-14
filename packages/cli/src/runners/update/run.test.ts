import { rm } from 'node:fs/promises'
import * as clack from '@clack/prompts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject, registryEntry, registryIndex, stubFetch } from '../../utils/registryFixture.ts'
import { installPackages } from '../init/utils.ts'
import { run } from './run.ts'

vi.mock('../init/utils.ts', () => ({
  detectPackageManager: vi.fn(() => ({ name: 'npm', lockFiles: [], initCommand: [], installCommand: ['install', '--save-dev'] })),
  installPackages: vi.fn(async () => {}),
}))
vi.mock('@clack/prompts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@clack/prompts')>()),
  multiselect: vi.fn(async () => ['acme/plugin-x']),
}))

let cwd: string
let output: Array<string>

beforeEach(async () => {
  cwd = await createProject({ '@acme/kubb-plugin-x': { version: '1.0.0' }, '@acme/kubb-plugin-y': { version: '2.0.0' }, 'left-pad': { version: '1.0.0' } })
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  output = []
  for (const method of ['log', 'warn', 'error'] as const) vi.spyOn(console, method).mockImplementation((...args) => void output.push(args.join(' ')))
  stubFetch({ body: registryIndex([registryEntry({ name: 'plugin-x', version: '1.1.0' }), registryEntry({ name: 'plugin-y', version: '2.0.0' })]) })
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(installPackages).mockClear()
  vi.mocked(clack.multiselect).mockClear()
  await rm(cwd, { recursive: true, force: true })
})

describe('kubb update', () => {
  it('lists the newer pins with --check and installs nothing', async () => {
    await run({ ids: [], check: true, yes: false })

    expect(output.join('\n')).toContain('@acme/kubb-plugin-x  plugin  1.0.0 -> 1.1.0')
    expect(output.join('\n')).not.toContain('@acme/kubb-plugin-y')
    expect(installPackages).not.toHaveBeenCalled()
  })

  it('asks which updates to install, showing the kind and the version change', async () => {
    await run({ ids: [], check: false, yes: false })

    expect(clack.multiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [{ value: 'acme/plugin-x', label: '@acme/kubb-plugin-x', hint: expect.stringContaining('plugin  1.0.0 -> ') }],
        initialValues: ['acme/plugin-x'],
      }),
    )
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x@1.1.0'], expect.objectContaining({ name: 'npm' }), cwd)
  })

  it('installs a newer GitHub release from its commit', async () => {
    const commit = '0123456789abcdef0123456789abcdef01234567'
    const artifact = { kind: 'github', owner: 'acme', repo: 'kubb-plugin-x', tag: 'v1.1.0', commit }
    stubFetch({ body: registryIndex([registryEntry({ name: 'plugin-x', version: '1.1.0', artifact })]) })

    await run({ ids: [], check: false, yes: true })

    expect(installPackages).toHaveBeenCalledWith([`github:acme/kubb-plugin-x#${commit}`], expect.objectContaining({ name: 'npm' }), cwd)
  })

  it('only updates the ids it is given', async () => {
    await run({ ids: ['acme/plugin-y'], check: false, yes: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toContain('No updates for acme/plugin-y.')
  })
})
