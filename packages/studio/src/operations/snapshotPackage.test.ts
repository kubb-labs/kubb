import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it, vi } from 'vitest'
import { createSnapshotPackage, uploadSnapshot } from './snapshotPackage.ts'

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

describe('[util] snapshotPackage', () => {
  it('aborts an upload when the agent shuts down', async () => {
    const shutdown = new AbortController()
    using fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })),
      )

    const upload = uploadSnapshot({
      bytes: Buffer.alloc(0),
      uploadPath: '/snapshot',
      studioUrl: 'https://studio.test',
      token: 'token',
      shutdown: shutdown.signal,
    })
    shutdown.abort(new Error('shutdown'))

    await expect(upload).rejects.toThrow('shutdown')
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })

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
