import { createHash } from 'node:crypto'
import { glob, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { promisify } from 'node:util'
import { gzip } from 'node:zlib'
import { build } from 'tsdown'

const gzipAsync = promisify(gzip)
const UPLOAD_TIMEOUT_MS = 120_000

type SnapshotFiles = Record<string, string>
type SnapshotPackage = { name: string; version: string; peerDependencies: Record<string, string> }

/**
 * Maps a generated file's path to its place inside the tarball, stripping everything before a
 * `src`/`dist` segment and any `..`/empty path segment so a crafted file name cannot escape the
 * `package/` root.
 */
function packagePath(filePath: string): string {
  const normalized = filePath.replaceAll('\\', '/')
  const relativePath = normalized.match(/\/(?:src|dist)\/.*$/)?.[0].slice(1) ?? normalized.replace(/^\/+/, '')
  const safe = relativePath
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')
  return `package/${safe}`
}

/**
 * Splits a tarball entry path into the legacy 100-byte `name` field and, when the path does not
 * fit, the 155-byte USTAR `prefix` field that extends it. Throws rather than silently truncating
 * a path the format cannot address (max 256 bytes: 100 name + 1 separator + 155 prefix).
 */
function splitEntryPath(path: string): { name: string; prefix: string } {
  if (Buffer.byteLength(path, 'utf8') <= 100) {
    return { name: path, prefix: '' }
  }

  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] !== '/') continue

    const prefix = path.slice(0, i)
    const name = path.slice(i + 1)
    if (Buffer.byteLength(prefix, 'utf8') <= 155 && Buffer.byteLength(name, 'utf8') <= 100) {
      return { name, prefix }
    }
  }

  throw new Error(`Snapshot path is too long for a tar entry: ${path}`)
}

function header(path: string, size: number): Buffer {
  const { name, prefix } = splitEntryPath(path)
  const value = Buffer.alloc(512)
  value.write(name, 0, 'utf8')
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
  value.write(prefix, 345, 'utf8')
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

  // Resolved once so the sanitized target for each file is computed exactly one way, and any two
  // generated files that collide after sanitizing (e.g. `a/../index.ts` and `a/index.ts`) are
  // caught here instead of silently overwriting one another later.
  const resolvedPaths = Object.entries(files).map(([name, content]) => ({ name, content, target: packagePath(name) }))
  const targetOwners = new Map<string, string>()
  for (const { name, target } of resolvedPaths) {
    const owner = targetOwners.get(target)
    if (owner) {
      throw new Error(`Snapshot has two generated files that sanitize to the same path "${target}": "${owner}" and "${name}"`)
    }
    targetOwners.set(target, name)
  }

  try {
    await mkdir(dist)
    await Promise.all(
      resolvedPaths.map(async ({ content, target }) => {
        const path = join(root, target.slice('package/'.length))
        await mkdir(join(path, '..'), { recursive: true })
        await writeFile(path, content)
      }),
    )
    const sourceEntries = resolvedPaths.filter(({ name }) => /\.(?:[cm]?[jt]sx?)$/.test(name)).map(({ target }) => join(root, target.slice('package/'.length)))
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
        .map(async (entry) => {
          // `unbundle: true` preserves dist's own subdirectory structure, so the archive path must
          // follow suit: `entry.name` alone is just the basename and would flatten (and collide)
          // nested output files.
          const filePath = join(entry.parentPath, entry.name)
          const distRelativePath = relative(dist, filePath).split(sep).join('/')
          return [`package/dist/${distRelativePath}`, await readFile(filePath, 'utf8')] as const
        }),
    )
    // Without `@kubb/plugin-barrel` the build produces no `dist/index.*`, so pointing
    // `main`/`module`/`exports['.']` at it would ship a manifest with missing files.
    const builtPaths = new Set(builtEntries.map(([path]) => path))
    const hasBarrel = builtPaths.has('package/dist/index.mjs') && builtPaths.has('package/dist/index.cjs')
    const barrelFields = hasBarrel ? { main: './dist/index.cjs', module: './dist/index.mjs' } : {}
    const barrelExport = hasBarrel ? { '.': { import: './dist/index.mjs', require: './dist/index.cjs' } } : {}

    const entries = {
      'package/package.json': JSON.stringify(
        {
          ...packageInfo,
          type: 'module',
          ...barrelFields,
          // `exports` denies any subpath it doesn't list, so the wildcard keeps individual
          // generated files (e.g. `models/Pet`) importable without a barrel.
          exports: { ...barrelExport, './*': { import: './dist/*.mjs', require: './dist/*.cjs' } },
        },
        null,
        2,
      ),
      ...Object.fromEntries(resolvedPaths.map(({ content, target }) => [target, content])),
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

export async function uploadSnapshot({
  bytes,
  uploadPath,
  studioUrl,
  token,
  shutdown,
}: {
  bytes: Buffer
  uploadPath: string
  studioUrl: string
  token: string
  shutdown?: AbortSignal
}): Promise<void> {
  const uploadUrl = new URL(uploadPath, studioUrl)
  if (uploadUrl.origin !== new URL(studioUrl).origin) throw new Error('Snapshot upload path must stay on the Studio origin')

  const timeout = AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
  const signal = shutdown ? AbortSignal.any([shutdown, timeout]) : timeout
  const redirect = await fetch(uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, redirect: 'manual', signal })
  const storageUrl = redirect.headers.get('location')
  if (redirect.status !== 307 || !storageUrl) throw new Error(`Studio did not provide a storage URL (status ${redirect.status})`)

  const storage = new URL(storageUrl)
  if (storage.protocol !== 'https:' && storage.hostname !== 'localhost' && storage.hostname !== '127.0.0.1') {
    throw new Error(`Refusing snapshot upload to ${storage.origin}`)
  }
  const response = await fetch(storage, { method: 'PUT', body: new Uint8Array(bytes), redirect: 'error', signal })
  if (!response.ok) throw new Error(`Snapshot upload failed with status ${response.status}`)
}
