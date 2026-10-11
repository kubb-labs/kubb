import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { gzip } from 'node:zlib'
import { type Config, fsStorage, type Hookable, type KubbHooks } from '@kubb/core'
import { type FetchResponse, ofetch } from 'ofetch'
import { generate, hashOf } from './generations.ts'
import { MAX_SNAPSHOT_BYTES, type PublishedSnapshot, type SnapshotUploadMetadata } from './protocol.ts'
import { resolvePeerDependencies } from './resolveConfig.ts'
import { defaultStudioUrl, secureUrl } from './url.ts'

const gzipAsync = promisify(gzip)
const UPLOAD_TIMEOUT_MS = 120_000

// Plugins whose output a snapshot carries without depending on the plugin package.
const BUNDLED_DEPENDENCIES = ['@kubb/plugin-barrel']

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
  // npm's fixed mtime, so the same files always pack to the same integrity.
  value.write('03560116604\0', 136, 'ascii')
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
export async function createSnapshotPackage(files: SnapshotFiles, packageInfo: SnapshotPackage): Promise<{ bytes: Buffer }> {
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
    if (sourceEntries.length) {
      // Loaded on first use: tsdown is large, and most agent processes never pack a snapshot.
      const { build } = await import('tsdown')
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
    }
    // `unbundle: true` keeps dist's subdirectories, so each entry keeps its path relative to `dist`.
    const builtEntries = await Promise.all(
      (await fsStorage().readKeys(dist)).map(async (key) => [`package/dist/${key}`, await readFile(join(dist, key), 'utf8')] as const),
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

    return { bytes: await gzipAsync(Buffer.concat([...chunks, Buffer.alloc(1024)])) }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

export type CreateSnapshotOptions = Omit<SnapshotUploadMetadata, 'hashes' | 'peerDependencies'> & {
  studioUrl?: string
  /**
   * Organization CI API key, sent as `x-api-key`.
   */
  apiKey: string
  /**
   * The project's Kubb config. Like `kubb generate`, it writes to `output.path`, then runs the
   * formatter, the linter, and `output.postGenerate`.
   */
  config: Config
  hooks?: Hookable<KubbHooks>
  signal?: AbortSignal
}

type UploadResponse = { snapshot?: PublishedSnapshot; message?: string; data?: { upgradeUrl?: string } }

function failureMessage({ status, _data }: FetchResponse<UploadResponse>): string {
  const upgrade = _data?.data?.upgradeUrl ? ` Upgrade at ${_data.data.upgradeUrl}.` : ''

  return `Kubb Studio refused the snapshot (status ${status})${_data?.message ? `: ${_data.message}` : ''}.${upgrade}`
}

/**
 * Generates the project, packs it as an npm tarball, and publishes it to Studio in one
 * `POST /api/snapshots` request.
 *
 * @example
 * ```ts
 * const snapshot = await createSnapshot({
 *   apiKey: process.env.KUBB_TOKEN!,
 *   config,
 *   id: 'gh:123:pr-4',
 *   name: 'acme/api#4',
 *   packageName: '@acme/api',
 *   version: '1.0.0',
 * })
 * console.log(snapshot.url, snapshot.changes)
 * ```
 */
export async function createSnapshot({
  studioUrl = defaultStudioUrl,
  apiKey,
  config,
  hooks,
  signal,
  ...metadata
}: CreateSnapshotOptions): Promise<PublishedSnapshot> {
  const url = secureUrl({ studioUrl, path: '/api/snapshots' })
  const generated = await generate({ config, hooks, signal, allowExec: true })
  const files = Object.fromEntries(
    await Promise.all(
      [...generated.paths].map(async (path) => {
        const content = await generated.storage.readItem(resolve(generated.root, path))
        if (content === null) throw new Error(`The generation listed ${path} but did not keep its content`)
        return [path, content] as const
      }),
    ),
  )
  const { peerDependencies, missingDependencies } = await resolvePeerDependencies(config.plugins.map(({ name }) => name))
  // The package would declare no version for a plugin that is not installed.
  const missing = missingDependencies.filter((dependency) => !BUNDLED_DEPENDENCIES.includes(dependency))
  if (missing.length) throw new Error(`Missing dependencies: ${missing.join(', ')}`)

  const { bytes } = await createSnapshotPackage(files, { name: metadata.packageName, version: metadata.version, peerDependencies })
  if (bytes.length > MAX_SNAPSHOT_BYTES) {
    throw new Error(`The snapshot is ${Math.ceil(bytes.length / 1024 / 1024)} MB, over the ${MAX_SNAPSHOT_BYTES / 1024 / 1024} MB limit`)
  }

  const hashes = Object.fromEntries(Object.entries(files).map(([path, content]) => [path, hashOf(content)]))
  const body = new FormData()
  body.set('metadata', JSON.stringify({ ...metadata, hashes, peerDependencies } satisfies SnapshotUploadMetadata))
  body.set('tarball', new Blob([new Uint8Array(bytes)], { type: 'application/gzip' }), 'snapshot.tgz')

  const timeout = AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
  // A redirect would forward the CI key and tarball to wherever it points.
  const response = await ofetch.raw<UploadResponse>(url.href, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body,
    redirect: 'error',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    ignoreResponseError: true,
  })
  if (!response.ok) throw new Error(failureMessage(response))

  const snapshot = response._data?.snapshot
  if (!snapshot) throw new Error(`Kubb Studio returned no snapshot (status ${response.status})`)
  return snapshot
}
