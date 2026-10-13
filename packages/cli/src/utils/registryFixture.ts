import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { vi } from 'vitest'

/** A registry entry for `@acme/kubb-<name>` pinned at `version`, with `manifest` merged over the default one. */
export function registryEntry({ name, version, kind = 'plugin', manifest }: { name: string; version: string; kind?: string; manifest?: object }) {
  return {
    id: `acme/${name}`,
    kind,
    type: 'community',
    artifact: { kind: 'npm', package: `@acme/kubb-${name}`, version },
    manifest: { kind, name, export: 'factory', displayName: name, description: 'An extension.', ...manifest },
    submittedAt: '2026-10-12T20:00:00Z',
    publishedAt: '2026-10-12T20:00:00Z',
    reviewedAt: '2026-10-12T20:00:00Z',
  }
}

/** A registry index that lists `extensions`. */
export function registryIndex(extensions: Array<object>) {
  return { version: 1, generatedAt: '2026-10-12T20:00:00Z', extensions }
}

/** Answers every `fetch` with `body` as JSON, or with an empty body when there is none. */
export function stubFetch({ status = 200, body }: { status?: number; body?: unknown }): void {
  const fetch = vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetch)
}

/** A project whose `devDependencies` are installed in `node_modules` at the given versions. */
export async function createProject(packages: Record<string, { version: string; manifest?: object }>): Promise<string> {
  const cwd = await mkdtemp(path.join(tmpdir(), 'kubb-registry-'))
  const devDependencies = Object.fromEntries(Object.entries(packages).map(([name, { version }]) => [name, `^${version}`]))
  await writeFile(path.join(cwd, 'package.json'), JSON.stringify({ devDependencies }))

  for (const [name, { version, manifest }] of Object.entries(packages)) {
    const dir = path.join(cwd, 'node_modules', name)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'package.json'), JSON.stringify({ name, version }))
    if (manifest) await writeFile(path.join(dir, 'kubb-extension.json'), JSON.stringify(manifest))
  }
  return cwd
}
