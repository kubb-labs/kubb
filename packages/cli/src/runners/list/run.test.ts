import { rm } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createProject, registryEntry } from '../../utils/registryFixture.ts'
import { listExtensions } from './run.ts'

const manifest = { kind: 'plugin', name: 'plugin-local', export: 'pluginLocal', displayName: 'Local', description: 'A local plugin.' }
let cwd: string | undefined

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  if (cwd) await rm(cwd, { recursive: true, force: true })
})

describe('kubb list', () => {
  it('lists installed packages that ship a manifest or have a registry entry', async () => {
    cwd = await createProject({
      '@acme/kubb-plugin-x': { version: '1.0.0' },
      '@acme/plugin-local': { version: '0.1.0', manifest },
      'left-pad': { version: '1.0.0' },
    })
    const index = { version: 1, generatedAt: '2026-10-12T20:00:00Z', extensions: [registryEntry({ name: 'plugin-x', version: '1.1.0' })] }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(index))),
    )

    expect(await listExtensions({ cwd, registry: 'https://registry.test' })).toStrictEqual([
      { id: 'acme/plugin-x', package: '@acme/kubb-plugin-x', installed: '1.0.0', registry: '1.1.0', update: true },
      { id: undefined, package: '@acme/plugin-local', installed: '0.1.0', registry: undefined, update: false },
    ])
  })

  it('still lists installed manifests when the registry cannot be reached', async () => {
    cwd = await createProject({ '@acme/plugin-local': { version: '0.1.0', manifest } })
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )

    expect(await listExtensions({ cwd, registry: 'https://registry.test' })).toStrictEqual([
      { id: undefined, package: '@acme/plugin-local', installed: '0.1.0', registry: undefined, update: false },
    ])
  })
})
