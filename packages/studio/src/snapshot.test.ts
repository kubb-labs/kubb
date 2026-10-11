import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { ast } from '@kubb/ast'
import { type Config, definePlugin, memoryStorage, type Plugin } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { hashOf } from './generations.ts'
import type { SnapshotUploadMetadata } from './protocol.ts'
import { createSnapshot, createSnapshotPackage } from './snapshot.ts'

/** Reads back the path (USTAR `prefix` + `name`) and content of every entry in a tarball. */
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
    const { bytes, integrity } = await createSnapshotPackage(
      { 'src/index.ts': 'export const answer = 42' },
      { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: { typescript: '^5.0.0' } },
    )

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
    expect(integrity).toBe(`sha512-${createHash('sha512').update(bytes).digest('base64')}`)
  })

  it('normalizes absolute generated file paths', async () => {
    const { bytes } = await createSnapshotPackage(
      { '/home/runner/work/plugins/plugins/examples/advanced/src/gen/index.ts': 'export {}' },
      { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} },
    )

    const tarball = gunzipSync(bytes).toString('utf8')
    expect(tarball).toContain('package/src/gen/index.ts')
    expect(tarball).not.toContain('package/home/runner')
  })

  it('preserves nested dist output paths from an unbundled multi-file build', async () => {
    const { bytes } = await createSnapshotPackage(
      {
        'src/index.ts': "export { helper } from './nested/helper.ts'",
        'src/nested/helper.ts': 'export const helper = 1',
      },
      { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} },
    )

    const paths = readTarEntries(gunzipSync(bytes)).map((entry) => entry.path)
    expect(paths).toContain('package/dist/nested/helper.mjs')
    expect(paths).toContain('package/dist/nested/helper.cjs')
  })
})

describe('createSnapshot', () => {
  const root = '/project'

  function config(): Config {
    const file = ast.factory.createFile({
      path: `${root}/src/gen/pet.ts`,
      baseName: 'pet.ts',
      sources: [ast.factory.createSource({ nodes: [ast.factory.createText('export const pet = 1')] })],
      imports: [],
      exports: [],
    })
    const plugin = definePlugin(() => ({
      name: 'plugin-barrel',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.injectFile(file)
        },
      },
    }))() as unknown as Plugin

    return {
      root,
      input: 'https://example.com/openapi.json',
      output: { path: 'src/gen', clean: false },
      parsers: [],
      reporters: [],
      adapter: createMockedAdapter(),
      plugins: [plugin],
      storage: memoryStorage(),
    } as unknown as Config
  }

  const options = { apiKey: 'kubb_key', id: 'gh:1:pr-2', name: 'acme/api#2', packageName: '@acme/api', version: '1.0.0', commit: 'abc' }

  it('sends one multipart request with the metadata, the agent-compatible hashes and the tarball', async () => {
    const snapshot = { id: 'snap-1', url: '/packages/ci/acme-api.tgz' }
    using fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ snapshot }, { status: 201 }))

    await expect(createSnapshot({ ...options, studioUrl: 'https://studio.test', config: config() })).resolves.toStrictEqual(snapshot)

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.href).toBe('https://studio.test/api/snapshots')
    expect(init.headers).toStrictEqual({ 'x-api-key': 'kubb_key' })
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

  it('names the upgrade page when Studio refuses the snapshot over a limit', async () => {
    using _ = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ message: 'Snapshot limit reached', data: { upgradeUrl: 'https://kubb.studio/billing' } }, { status: 402 }))

    await expect(createSnapshot({ ...options, studioUrl: 'https://studio.test', config: config() })).rejects.toThrow(
      'Kubb Studio refused the snapshot (status 402): Snapshot limit reached. Upgrade at https://kubb.studio/billing.',
    )
  })

  it('refuses a plaintext Studio URL before generating', async () => {
    using fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(createSnapshot({ ...options, studioUrl: 'http://studio.test', config: config() })).rejects.toThrow('Refusing to reach Kubb Studio')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
