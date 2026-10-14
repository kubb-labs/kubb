import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { type Config, fsStorage, type Hookable, type KubbHooks, readInstalledPackages, resolveMeta } from '@kubb/core'
import { ofetch } from 'ofetch'
import { generate, hashOf } from './generations.ts'
import { MAX_SNAPSHOT_BYTES, type PublishedSnapshot, type SnapshotUploadMetadata } from './protocol.ts'
import { toPackageName } from './resolveConfig.ts'
import { defaultStudioUrl, secureUrl } from './url.ts'

const UPLOAD_TIMEOUT_MS = 120_000

// Plugins whose output a snapshot carries without depending on the plugin package.
const BUNDLED_DEPENDENCIES = ['@kubb/plugin-barrel']

type SnapshotFiles = Record<string, string>
type SnapshotPackage = { name: string; version: string; peerDependencies: Record<string, string> }

/**
 * Maps a generated file to its path in the package, from its `src`/`dist` segment on, without `..` parts that could escape it.
 */
function packagePath(filePath: string): string {
  const normalized = filePath.replaceAll('\\', '/')
  const relativePath = normalized.match(/\/(?:src|dist)\/.*$/)?.[0] ?? normalized
  return relativePath
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')
}

/**
 * Splits a tar path into the 100-byte USTAR `name` and the 155-byte `prefix`, and throws for a path that fits neither.
 */
function splitEntryPath(path: string): { name: string; prefix: string } {
  if (Buffer.byteLength(path) <= 100) return { name: path, prefix: '' }
  for (let i = path.lastIndexOf('/'); i > 0; i = path.lastIndexOf('/', i - 1)) {
    const prefix = path.slice(0, i)
    const name = path.slice(i + 1)
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) return { name, prefix }
  }
  throw new Error(`Snapshot path is too long for a tar entry: ${path}`)
}

function header(path: string, size: number): Buffer {
  const { name, prefix } = splitEntryPath(path)
  const value = Buffer.alloc(512)
  value.write(name)
  value.write('0000644\0', 100)
  for (const offset of [108, 116, 265, 297]) value.write('0000000\0', offset)
  value.write(`${size.toString(8).padStart(11, '0')}\0`, 124)
  // npm's fixed mtime, so the same files always pack to the same integrity.
  value.write('03560116604\0', 136)
  value.fill(32, 148, 156)
  value.write('0', 156)
  value.write('ustar\0', 257)
  value.write('00', 263)
  value.write(prefix, 345)
  const checksum = value.reduce((sum, byte) => sum + byte, 0)
  value.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148)
  return value
}

/**
 * Packs a generation's files into a gzipped, npm-installable tarball: a `package/` root with the
 * generated sources, a `tsdown`-built `dist/` (esm + cjs), and a `package.json` manifest.
 */
export async function createSnapshotPackage({ files, packageInfo }: { files: SnapshotFiles; packageInfo: SnapshotPackage }): Promise<Buffer> {
  const sources = new Map<string, { name: string; content: string }>()
  for (const [name, content] of Object.entries(files)) {
    const path = packagePath(name)
    const owner = sources.get(path)?.name
    if (owner) throw new Error(`Snapshot has two generated files that sanitize to the same path "package/${path}": "${owner}" and "${name}"`)
    sources.set(path, { name, content })
  }
  const root = await mkdtemp(join(tmpdir(), 'kubb-snapshot-'))
  const dist = join(root, 'dist')

  try {
    await mkdir(dist)
    await Promise.all(
      [...sources].map(async ([path, { content }]) => {
        await mkdir(dirname(join(root, path)), { recursive: true })
        await writeFile(join(root, path), content)
      }),
    )
    const entry = [...sources.keys()].filter((path) => /\.(?:[cm]?[jt]sx?)$/.test(path)).map((path) => join(root, path))
    if (entry.length) {
      // An optional peer: tsdown is large, and only `kubb studio snapshot` packs a snapshot.
      const { build } = await import('tsdown').catch((cause: unknown) => {
        throw new Error('`kubb studio snapshot` builds the package with tsdown. Install it in the project: `npm install --save-dev tsdown`', { cause })
      })
      // `fixedExtension` emits the `.mjs`/`.cjs` the manifest names, whatever "type" the host's own package.json sets.
      await build({
        entry,
        outDir: dist,
        format: ['esm', 'cjs'],
        dts: false,
        sourcemap: false,
        unbundle: true,
        report: false,
        logLevel: 'silent',
        fixedExtension: true,
      })
    }
    const built = await fsStorage().readKeys(dist)
    // Only `@kubb/plugin-barrel` produces a `dist/index.*` for `main`, `module`, and `exports['.']` to name.
    const hasBarrel = built.includes('index.mjs') && built.includes('index.cjs')
    const manifest = {
      ...packageInfo,
      type: 'module',
      ...(hasBarrel ? { main: './dist/index.cjs', module: './dist/index.mjs' } : {}),
      // `exports` denies any subpath it does not list, so the wildcard keeps each generated file importable.
      exports: {
        ...(hasBarrel ? { '.': { import: './dist/index.mjs', require: './dist/index.cjs' } } : {}),
        './*': { import: './dist/*.mjs', require: './dist/*.cjs' },
      },
    }
    const entries = new Map<string, string>([
      ['package.json', JSON.stringify(manifest, null, 2)],
      ...[...sources].map(([path, { content }]) => [path, content] as const),
      ...(await Promise.all(built.map(async (key) => [`dist/${key}`, await readFile(join(dist, key), 'utf8')] as const))),
    ])
    const chunks = [...entries].flatMap(([path, content]) => {
      const bytes = Buffer.from(content)
      return [header(`package/${path}`, bytes.length), bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512)]
    })
    return gzipSync(Buffer.concat([...chunks, Buffer.alloc(1024)]))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

type CreateSnapshotOptions = Omit<SnapshotUploadMetadata, 'hashes' | 'peerDependencies'> & {
  studioUrl?: string
  /**
   * Organization CI API key, sent as `x-api-key`.
   */
  apiKey: string
  /**
   * The project's Kubb config, generated like `kubb generate`: formatter, linter, and `output.postGenerate` included.
   */
  config: Config
  hooks?: Hookable<KubbHooks>
  signal?: AbortSignal
}

/**
 * Generates the project, packs it as an npm tarball, and publishes it to Studio in one `POST /api/snapshots` request.
 *
 * @example
 * ```ts
 * const { url } = await createSnapshot({ apiKey: process.env.KUBB_TOKEN!, config, id: 'gh:123:pr-4', name: 'acme/api#4', packageName: '@acme/api', version: '1.0.0' })
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
  const pluginNames = config.plugins.map((plugin) => resolveMeta(plugin).name)
  const installed = await readInstalledPackages({ root: config.root, packages: pluginNames.map(toPackageName), resolveFrom: ['kubb'] })
  // A third-party plugin is found by the manifest its package ships, as `@kubb/plugin-x` only names a built-in.
  const packageOf = (name: string) => installed.find(({ manifest }) => manifest?.kind === 'plugin' && manifest.name === name)?.package ?? toPackageName(name)
  const names = [...new Set(pluginNames.map(packageOf))]
  const peerDependencies = Object.fromEntries(installed.flatMap(({ package: name, version }) => (names.includes(name) && version ? [[name, version]] : [])))
  // The package would declare no version for a plugin that is not installed.
  const missing = names.filter((name) => !(name in peerDependencies) && !BUNDLED_DEPENDENCIES.includes(name))
  if (missing.length) throw new Error(`Missing dependencies: ${missing.join(', ')}`)

  const bytes = await createSnapshotPackage({ files, packageInfo: { name: metadata.packageName, version: metadata.version, peerDependencies } })
  if (bytes.length > MAX_SNAPSHOT_BYTES) {
    throw new Error(`The snapshot is ${Math.ceil(bytes.length / 1024 / 1024)} MB, over the ${MAX_SNAPSHOT_BYTES / 1024 / 1024} MB limit`)
  }

  const hashes = Object.fromEntries(Object.entries(files).map(([path, content]) => [path, hashOf(content)]))
  const body = new FormData()
  body.set('metadata', JSON.stringify({ ...metadata, hashes, peerDependencies } satisfies SnapshotUploadMetadata))
  body.set('tarball', new Blob([new Uint8Array(bytes)], { type: 'application/gzip' }), 'snapshot.tgz')

  const timeout = AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
  // A redirect would forward the CI key and tarball to wherever it points.
  const { ok, status, _data } = await ofetch.raw<{ snapshot?: PublishedSnapshot; message?: string; data?: { upgradeUrl?: string } }>(url.href, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body,
    redirect: 'error',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    ignoreResponseError: true,
  })
  if (!ok) {
    const upgrade = _data?.data?.upgradeUrl ? ` Upgrade at ${_data.data.upgradeUrl}.` : ''
    throw new Error(`Kubb Studio refused the snapshot (status ${status})${_data?.message ? `: ${_data.message}` : ''}.${upgrade}`)
  }
  if (!_data?.snapshot) throw new Error(`Kubb Studio returned no snapshot (status ${status})`)
  return _data.snapshot
}
