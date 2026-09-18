import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { createSnapshotPackage } from './snapshotPackage.ts'

const execFileAsync = promisify(execFile)

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
  main?: string
  module?: string
  exports: Record<string, { import: string; require: string }>
}

function readManifest(bytes: Buffer): Manifest {
  const entry = readTarEntries(gunzipSync(bytes)).find(({ path }) => path === 'package/package.json')
  if (!entry) throw new Error('Tarball has no package/package.json')

  return JSON.parse(entry.content) as Manifest
}

/** Unpacks a tarball into `<root>/node_modules/<name>`, as an install would, and returns the root. */
async function installTarball(bytes: Buffer, packageName: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'kubb-snapshot-consumer-'))
  const target = join(root, 'node_modules', ...packageName.split('/'))

  for (const { path, content } of readTarEntries(gunzipSync(bytes))) {
    const file = join(target, path.slice('package/'.length))
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, content)
  }

  return root
}

/** A generated project with no `@kubb/plugin-barrel`, so the build produces no `dist/index.*`. */
const filesWithoutBarrel = {
  'src/models/Pet.ts': "export const petName = 'doggie'",
  'src/hooks/usePet.ts': "import { petName } from '../models/Pet.ts'\nexport function usePet() {\n  return petName\n}",
}

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

  it('rejects generated files that sanitize to the same path', async () => {
    await expect(
      createSnapshotPackage(
        { 'a/index.ts': 'export const a = 1', 'a/../index.ts': 'export const a = 2' },
        { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} },
      ),
    ).rejects.toThrow(/collide|same path/)
  })

  it('addresses a tar entry path over 100 bytes with the USTAR prefix field', async () => {
    const longSegment = 'x'.repeat(90)
    const { bytes } = await createSnapshotPackage(
      { [`src/${longSegment}/index.ts`]: 'export {}' },
      { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} },
    )

    const entries = readTarEntries(gunzipSync(bytes))
    const entry = entries.find(({ path }) => path.endsWith('index.ts'))
    expect(entry?.path).toBe(`package/src/${longSegment}/index.ts`)
    expect(entry?.content).toBe('export {}')
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

  it('points the barrel fields at dist/index and still exports the wildcard', async () => {
    const { bytes } = await createSnapshotPackage(
      { 'src/index.ts': 'export const answer = 42' },
      { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} },
    )

    const manifest = readManifest(bytes)

    expect(manifest.main).toBe('./dist/index.cjs')
    expect(manifest.module).toBe('./dist/index.mjs')
    expect(manifest.exports['.']).toEqual({ import: './dist/index.mjs', require: './dist/index.cjs' })
    expect(manifest.exports['./*']).toEqual({ import: './dist/*.mjs', require: './dist/*.cjs' })
  })

  it('omits the barrel fields when the build produced no dist/index', async () => {
    const { bytes } = await createSnapshotPackage(filesWithoutBarrel, { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} })

    const paths = readTarEntries(gunzipSync(bytes)).map((entry) => entry.path)
    const manifest = readManifest(bytes)

    expect(paths).not.toContain('package/dist/index.mjs')
    expect(manifest.main).toBeUndefined()
    expect(manifest.module).toBeUndefined()
    expect(manifest.exports['.']).toBeUndefined()
    expect(manifest.exports['./*']).toEqual({ import: './dist/*.mjs', require: './dist/*.cjs' })
  })

  it('resolves and loads a barrel-less subpath under both import and require', async () => {
    const { bytes } = await createSnapshotPackage(filesWithoutBarrel, { name: '@kubb/snapshot-test', version: '1.2.3', peerDependencies: {} })
    const root = await installTarball(bytes, '@kubb/snapshot-test')
    const consumer = join(root, 'consumer.mjs')

    try {
      await writeFile(
        consumer,
        [
          "import { createRequire } from 'node:module'",
          'const require = createRequire(import.meta.url)',
          "const esm = await import('@kubb/snapshot-test/hooks/usePet')",
          "const cjs = require('@kubb/snapshot-test/hooks/usePet')",
          'console.log(',
          '  JSON.stringify({',
          "    esmUrl: import.meta.resolve('@kubb/snapshot-test/hooks/usePet'),",
          "    cjsPath: require.resolve('@kubb/snapshot-test/hooks/usePet'),",
          '    esmValue: esm.usePet(),',
          '    cjsValue: cjs.usePet(),',
          '  }),',
          ')',
        ].join('\n'),
      )

      const { stdout } = await execFileAsync(process.execPath, [consumer])
      const result = JSON.parse(stdout) as { esmUrl: string; cjsPath: string; esmValue: string; cjsValue: string }

      expect(result.esmUrl).toMatch(/dist\/hooks\/usePet\.mjs$/)
      expect(result.cjsPath).toMatch(/dist[/\\]hooks[/\\]usePet\.cjs$/)
      expect(result.esmValue).toBe('doggie')
      expect(result.cjsValue).toBe('doggie')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  }, 60_000)
})
