import { rm } from 'node:fs/promises'
import * as clack from '@clack/prompts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject, registryEntry } from '../../utils/registryFixture.ts'
import { installPackages } from '../init/utils.ts'
import { run } from './run.ts'

vi.mock('../init/utils.ts', () => ({
  detectPackageManager: vi.fn(() => ({ name: 'npm', lockFiles: [], initCommand: [], installCommand: ['install', '--save-dev'] })),
  installPackages: vi.fn(async () => {}),
}))
vi.mock('@clack/prompts', async (importOriginal) => ({ ...(await importOriginal<typeof import('@clack/prompts')>()), confirm: vi.fn(async () => true) }))

let cwd: string
let output: Array<string>

beforeEach(async () => {
  cwd = await createProject({ '@acme/kubb-plugin-x': { version: '1.0.0' }, '@acme/kubb-plugin-y': { version: '2.0.0' }, 'left-pad': { version: '1.0.0' } })
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  output = []
  for (const method of ['log', 'warn', 'error'] as const) vi.spyOn(console, method).mockImplementation((...args) => void output.push(args.join(' ')))
  const index = {
    version: 1,
    generatedAt: '2026-10-12T20:00:00Z',
    extensions: [registryEntry({ name: 'plugin-x', version: '1.1.0' }), registryEntry({ name: 'plugin-y', version: '2.0.0' })],
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(index))),
  )
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(installPackages).mockClear()
  vi.mocked(clack.confirm).mockClear()
  await rm(cwd, { recursive: true, force: true })
})

describe('kubb update', () => {
  it('lists the newer pins with --check and installs nothing', async () => {
    await run({ ids: [], check: true, yes: false })

    expect(output.join('\n')).toContain('@acme/kubb-plugin-x  1.0.0 -> 1.1.0')
    expect(output.join('\n')).not.toContain('@acme/kubb-plugin-y')
    expect(installPackages).not.toHaveBeenCalled()
  })

  it('asks, then installs the newer pinned version', async () => {
    await run({ ids: [], check: false, yes: false })

    expect(clack.confirm).toHaveBeenCalledOnce()
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x@1.1.0'], expect.objectContaining({ name: 'npm' }), cwd)
  })

  it('only updates the ids it is given', async () => {
    await run({ ids: ['acme/plugin-y'], check: false, yes: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toContain('No updates for acme/plugin-y.')
  })
})
