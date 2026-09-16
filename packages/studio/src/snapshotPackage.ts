import { createHash } from 'node:crypto'
import { glob, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { gzip } from 'node:zlib'
import { build } from 'tsdown'

const gzipAsync = promisify(gzip)

type SnapshotFiles = Record<string, string>
type SnapshotPackage = { name: string; version: string; peerDependencies: Record<string, string> }

/**
 * Maps a generated file's path to its place inside the tarball, stripping everything before a
 * `src`/`dist` segment and any `..`/empty path segment so a crafted file name cannot escape the
 * `package/` root.
 */
function packagePath(filePath: string): string {
  const normalized = filePath.replaceAll('\\', '/')
  const relative = normalized.match(/\/(?:src|dist)\/.*$/)?.[0].slice(1) ?? normalized.replace(/^\/+/, '')
  const safe = relative
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')
  return `package/${safe}`
}

function header(name: string, size: number): Buffer {
  const value = Buffer.alloc(512)
  value.write(name.slice(0, 100), 0, 'utf8')
  value.write('0000644\0', 100, 'ascii')
  value.write('0000000\0', 108, 'ascii')
  value.write('0000000\0', 116, 'ascii')
  value.write(`${size.toString(8).padStart(11, '0')}\0`, 124, 'ascii')
  value.write(
    `${Math.floor(Date.now() / 1000)
      .toString(8)
      .padStart(11, '0')}\0`,
    136,
    'ascii',
  )
  value.fill(32, 148, 156)
  value.write('0', 156, 'ascii')
  value.write('ustar\0', 257, 'ascii')
  value.write('00', 263, 'ascii')
  value.write('0000000\0', 265, 'ascii')
  value.write('0000000\0', 297, 'ascii')
  const checksum = [...value].reduce((sum, byte) => sum + byte, 0)
  value.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 'ascii')
  return value
}

/**
 * Packs a generation's files into a gzipped, npm-installable tarball: a `package/` root with the
 * generated sources, a `tsdown`-built `dist/` (esm + cjs), and a `package.json` manifest.
 */
export async function createSnapshotPackage(files: SnapshotFiles, packageInfo: SnapshotPackage): Promise<{ bytes: Buffer; integrity: string }> {
  const root = await mkdtemp(join(tmpdir(), 'kubb-snapshot-'))
  const dist = join(root, 'dist')

  try {
    await mkdir(dist)
    await Promise.all(
      Object.entries(files).map(async ([name, content]) => {
        const target = join(root, packagePath(name).slice('package/'.length))
        await mkdir(join(target, '..'), { recursive: true })
        await writeFile(target, content)
      }),
    )
    const sourceEntries = Object.keys(files)
      .filter((name) => /\.(?:[cm]?[jt]sx?)$/.test(name))
      .map((name) => join(root, packagePath(name).slice('package/'.length)))
    if (sourceEntries.length)
      await build({
        entry: sourceEntries,
        outDir: dist,
        format: ['esm', 'cjs'],
        dts: false,
        sourcemap: false,
        unbundle: true,
        report: false,
        logLevel: 'silent',
        // The manifest below always points at `.mjs`/`.cjs`, so the build must produce those
        // extensions regardless of the host process's own `package.json` "type" (tsdown otherwise
        // infers it from the nearest ancestor package.json, which differs by host).
        fixedExtension: true,
      })
    const builtEntries = await Promise.all(
      (await Array.fromAsync(glob('**/*', { cwd: dist, withFileTypes: true })))
        .filter((entry) => entry.isFile())
        .map(async (entry) => [`package/dist/${entry.name}`, await readFile(join(entry.parentPath, entry.name), 'utf8')] as const),
    )
    const entries = {
      'package/package.json': JSON.stringify(
        {
          ...packageInfo,
          type: 'module',
          main: './dist/index.cjs',
          module: './dist/index.mjs',
          exports: { '.': { import: './dist/index.mjs', require: './dist/index.cjs' } },
        },
        null,
        2,
      ),
      ...Object.fromEntries(Object.entries(files).map(([name, content]) => [packagePath(name), content])),
      ...Object.fromEntries(builtEntries),
    }
    const chunks: Array<Buffer> = []

    for (const [name, content] of Object.entries(entries)) {
      const bytes = Buffer.from(content)
      chunks.push(header(name, bytes.length), bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512))
    }

    const bytes = await gzipAsync(Buffer.concat([...chunks, Buffer.alloc(1024)]))
    return { bytes, integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}` }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
