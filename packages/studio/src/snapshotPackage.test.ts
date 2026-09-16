import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { createSnapshotPackage } from './snapshotPackage.ts'

describe('[util] snapshotPackage', () => {
  it('creates a gzip tarball with a package manifest and generated files', () => {
    const result = createSnapshotPackage(
      { 'index.js': 'export const answer = 42' },
      {
        name: '@kubb/snapshot-test',
        version: '1.2.3',
        peerDependencies: { typescript: '^5.0.0' },
      },
    )

    return result.then(({ bytes, integrity }) => {
      const tarball = gunzipSync(bytes).toString('utf8')
      expect(tarball).toContain('package/package.json')
      expect(tarball).toContain('"name": "@kubb/snapshot-test"')
      expect(tarball).toContain('"version": "1.2.3"')
      expect(tarball).toContain('"peerDependencies": {')
      expect(tarball).toContain('package/index.js')
      expect(tarball).toContain('export const answer = 42')
      expect(tarball).toContain('package/dist/index.mjs')
      expect(tarball).toContain('package/dist/index.cjs')
      expect(integrity).toMatch(/^sha512-/)
    })
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
})
