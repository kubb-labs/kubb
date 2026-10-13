import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { type Config, defineExtension, resolveCacheDir } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import { hashOf } from './generations.ts'
import type { SnapshotUploadMetadata } from './protocol.ts'
import { createSnapshot, createSnapshotPackage } from './snapshot.ts'
import { projectConfig } from './testing.ts'

/**
 * Reads back the path (USTAR `prefix` + `name`) and content of every entry in a tarball.
 */
function readTarEntries(tar: Buffer): Array<{ path: string; content: string }> {
  const entries: Array<{ path: string; content: string }> = []
  let offset = 0

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break

    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/s, '')
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/s, '')
    const size = Number.parseInt(header.subarray(124, 136).toString('ascii').replace(/\0.*$/s, '').trim(), 8)
    offset += 512

    entries.push({ path: prefix ? `${prefix}/${name}` : name, content: tar.subarray(offset, offset + size).toString('utf8') })
    offset += Math.ceil(size / 512) * 512
  }

  return entries
}

type Manifest = {
  name: string
  version: string
  peerDependencies: Record<string, string>
  type: string
  main?: string
  module?: string
  exports: Record<string, { import: string; require: string }>
}

function readManifest(bytes: Buffer): Manifest {
  const entry = readTarEntries(gunzipSync(bytes)).find(({ path }) => path === 'package/package.json')
  if (!entry) throw new Error('Tarball has no package/package.json')

  return JSON.parse(entry.content) as Manifest
}

describe('createSnapshotPackage', () => {
  it('packs the sources, a dist build and a manifest whose barrel fields point at dist/index', async () => {
    const bytes = await createSnapshotPackage({
      files: { 'src/index.ts': 'export const answer = 42' },
      packageInfo: { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: { typescript: '^5.0.0' } },
    })

    const entries = readTarEntries(gunzipSync(bytes))
    expect(entries.map((entry) => entry.path)).toStrictEqual([
      'package/package.json',
      'package/src/index.ts',
      'package/dist/index.cjs',
      'package/dist/index.mjs',
    ])
    expect(entries[1]?.content).toBe('export const answer = 42')
    expect(readManifest(bytes)).toStrictEqual({
      name: '@kubb/snapshot-test',
      version: '1.2.3',
      peerDependencies: { typescript: '^5.0.0' },
      type: 'module',
      main: './dist/index.cjs',
      module: './dist/index.mjs',
      exports: { '.': { import: './dist/index.mjs', require: './dist/index.cjs' }, './*': { import: './dist/*.mjs', require: './dist/*.cjs' } },
    })
  })

  it('normalizes absolute generated file paths', async () => {
    const bytes = await createSnapshotPackage({
      files: { '/home/runner/work/plugins/plugins/examples/advanced/src/gen/index.ts': 'export {}' },
      packageInfo: { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} },
    })

    const tarball = gunzipSync(bytes).toString('utf8')
    expect(tarball).toContain('package/src/gen/index.ts')
    expect(tarball).not.toContain('package/home/runner')
  })

  it('preserves nested dist output paths from an unbundled multi-file build', async () => {
    const bytes = await createSnapshotPackage({
      files: {
        'src/index.ts': "export { helper } from './nested/helper.ts'",
        'src/nested/helper.ts': 'export const helper = 1',
      },
      packageInfo: { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} },
    })

    const paths = readTarEntries(gunzipSync(bytes)).map((entry) => entry.path)
    expect(paths).toContain('package/dist/nested/helper.mjs')
    expect(paths).toContain('package/dist/nested/helper.cjs')
  })
})

describe('createSnapshot', () => {
  const options = { apiKey: 'kubb_key', id: 'gh:1:pr-2', name: 'acme/api#2', packageName: '@acme/api', version: '1.0.0', commit: 'abc' }

  it('sends one multipart request with the metadata, the agent-compatible hashes and the tarball', async () => {
    const snapshot = { id: 'snap-1', url: '/packages/ci/acme-api.tgz' }
    using fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ snapshot }, { status: 201 }))

    await expect(createSnapshot({ ...options, studioUrl: 'https://studio.test', config: projectConfig() })).resolves.toStrictEqual(snapshot)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://studio.test/api/snapshots')
    expect(new Headers(init.headers).get('x-api-key')).toBe('kubb_key')
    expect(init.redirect).toBe('error')
    const body = init.body as FormData
    expect(JSON.parse(String(body.get('metadata'))) as SnapshotUploadMetadata).toStrictEqual({
      id: 'gh:1:pr-2',
      name: 'acme/api#2',
      packageName: '@acme/api',
      version: '1.0.0',
      commit: 'abc',
      hashes: { 'src/gen/pet.ts': hashOf('export const pet = 1') },
      peerDependencies: { '@kubb/plugin-barrel': expect.any(String) },
    })
    expect(readManifest(Buffer.from(await (body.get('tarball') as Blob).arrayBuffer()))).toMatchObject({ name: '@acme/api', version: '1.0.0' })
  })

  it('declares a third-party plugin by the package that ships its manifest', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'kubb-snapshot-project-'))
    const dir = join(projectRoot, 'node_modules', '@acme', 'kubb-plugin-x')
    await mkdir(dir, { recursive: true })
    await writeFile(join(projectRoot, 'package.json'), JSON.stringify({ devDependencies: { '@acme/kubb-plugin-x': '^1.0.0' } }))
    await writeFile(join(dir, 'package.json'), JSON.stringify({ name: '@acme/kubb-plugin-x', version: '1.2.3' }))
    await writeFile(
      join(dir, 'kubb-extension.json'),
      JSON.stringify({ kind: 'plugin', name: 'plugin-x', export: 'pluginX', displayName: 'X', description: 'Generates X.' }),
    )
    const config = projectConfig({ projectRoot })
    const pluginX = defineExtension({ kind: 'plugin', meta: { name: 'plugin-x' }, hooks: {} })()
    using fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ snapshot: { id: 'snap-1' } }, { status: 201 }))

    try {
      await createSnapshot({ ...options, studioUrl: 'https://studio.test', config: { ...config, plugins: [...config.plugins, pluginX] } })
    } finally {
      await Promise.all([rm(projectRoot, { recursive: true, force: true }), rm(resolveCacheDir(projectRoot), { recursive: true, force: true })])
    }

    const body = fetchMock.mock.calls[0]![1]!.body as FormData
    expect((JSON.parse(String(body.get('metadata'))) as SnapshotUploadMetadata).peerDependencies).toStrictEqual({
      '@kubb/plugin-barrel': expect.any(String),
      '@acme/kubb-plugin-x': '1.2.3',
    })
  })

  it('packs the output after output.postGenerate ran, like kubb generate', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'kubb-snapshot-project-'))
    const rewrite = `node -e "require('fs').writeFileSync('src/gen/pet.ts', 'export const pet = 2')"`
    const config = projectConfig({ projectRoot })
    using fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ snapshot: { id: 'snap-1' } }, { status: 201 }))

    try {
      await createSnapshot({ ...options, studioUrl: 'https://studio.test', config: { ...config, output: { ...config.output, postGenerate: [rewrite] } } })
    } finally {
      await Promise.all([rm(projectRoot, { recursive: true, force: true }), rm(resolveCacheDir(projectRoot), { recursive: true, force: true })])
    }

    const body = fetchMock.mock.calls[0]![1]!.body as FormData
    expect((JSON.parse(String(body.get('metadata'))) as SnapshotUploadMetadata).hashes).toStrictEqual({ 'src/gen/pet.ts': hashOf('export const pet = 2') })
  })

  it('packs a config without storage, as kubb studio snapshot loads it, from the default fs storage', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'kubb-snapshot-project-'))
    const { storage: _storage, ...config } = projectConfig({ projectRoot })
    using fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ snapshot: { id: 'snap-1' } }, { status: 201 }))

    try {
      await createSnapshot({ ...options, studioUrl: 'https://studio.test', config: config as Config })
    } finally {
      await Promise.all([rm(projectRoot, { recursive: true, force: true }), rm(resolveCacheDir(projectRoot), { recursive: true, force: true })])
    }

    const body = fetchMock.mock.calls[0]![1]!.body as FormData
    const entries = readTarEntries(gunzipSync(Buffer.from(await (body.get('tarball') as Blob).arrayBuffer())))
    expect(entries.find(({ path }) => path === 'package/src/gen/pet.ts')?.content).toContain('export const pet = 1')
  })

  it('names the upgrade page when Studio refuses the snapshot over a limit', async () => {
    using _ = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ message: 'Snapshot limit reached', data: { upgradeUrl: 'https://kubb.studio/billing' } }, { status: 402 }))

    await expect(createSnapshot({ ...options, studioUrl: 'https://studio.test', config: projectConfig() })).rejects.toThrow(
      'Kubb Studio refused the snapshot (status 402): Snapshot limit reached. Upgrade at https://kubb.studio/billing.',
    )
  })

  it('names the status when a successful response carries no snapshot', async () => {
    using _ = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html></html>', { status: 200 }))

    await expect(createSnapshot({ ...options, studioUrl: 'https://studio.test', config: projectConfig() })).rejects.toThrow(
      'Kubb Studio returned no snapshot (status 200)',
    )
  })
})
