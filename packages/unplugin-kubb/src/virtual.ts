import { posix, relative } from 'node:path'
import type { Storage } from '@kubb/core'
import { toPosixPath } from '@internals/utils'

/** Entry import, mapping to the root barrel. Namespaced so it never collides with the real `kubb` package. */
export const VIRTUAL_ENTRY = 'kubb:gen'
/** Prefix for importing a specific generated file, e.g. `kubb:gen/client/usePets.ts`. */
export const VIRTUAL_PREFIX = 'kubb:gen/'
/** Resolved id prefix. The leading null byte marks it virtual so other plugins ignore it. */
export const RESOLVED_PREFIX = '\0kubb:gen/'

/**
 * The in-memory generated output served as virtual modules. `map` is keyed by path relative to the
 * output root (POSIX). `barrelRelPath` is the root barrel that the `kubb:gen` import maps to, or
 * `null` when no barrel was generated.
 */
export type VirtualStore = {
  map: Map<string, string>
  barrelRelPath: string | null
}

/** Reads every generated file from `storage` into a store keyed by output-relative POSIX paths. */
export async function buildVirtualStore({ storage, outputRoot }: { storage: Storage; outputRoot: string }): Promise<VirtualStore> {
  const map = new Map<string, string>()
  for (const key of await storage.getKeys()) {
    const source = await storage.getItem(key)
    if (source === null) continue
    map.set(toPosixPath(relative(outputRoot, key)), source)
  }
  return { map, barrelRelPath: map.has('index.ts') ? 'index.ts' : null }
}

/** Candidate Map keys for a specifier, covering both the bare specifier and the ones that carry a file extension. */
export function candidateKeys(relativePath: string): Array<string> {
  const base = relativePath.replace(/^\.?\//, '').replace(/\/$/, '')
  return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}/index.ts`]
}

export function toResolvedId(relativePath: string): string {
  return `${RESOLVED_PREFIX}${relativePath}`
}

export function fromResolvedId(id: string): string | null {
  return id.startsWith(RESOLVED_PREFIX) ? id.slice(RESOLVED_PREFIX.length) : null
}

function resolveKey(relativePath: string, store: VirtualStore): string | null {
  for (const candidate of candidateKeys(relativePath)) {
    if (store.map.has(candidate)) return toResolvedId(candidate)
  }
  return null
}

/**
 * Maps an import specifier to a resolved virtual id, or `null` when it isn't ours. Handles the
 * `kubb:gen` entry, explicit `kubb:gen/<file>` ids, and relative imports between already-virtual
 * modules (how Kubb's generated files reference each other).
 */
export function resolveVirtual({ id, importer, store }: { id: string; importer: string | undefined; store: VirtualStore }): string | null {
  if (id === VIRTUAL_ENTRY) {
    return store.barrelRelPath ? toResolvedId(store.barrelRelPath) : null
  }
  if (id.startsWith(VIRTUAL_PREFIX)) {
    return resolveKey(id.slice(VIRTUAL_PREFIX.length), store)
  }
  if (importer && fromResolvedId(importer) !== null && (id.startsWith('./') || id.startsWith('../'))) {
    const importerRelative = fromResolvedId(importer)!
    const target = posix.normalize(posix.join(posix.dirname(importerRelative), id))
    return resolveKey(target, store)
  }
  return null
}

/** Returns the source for a resolved virtual id, or `null` when the id isn't a known virtual module. */
export function loadVirtual({ id, store }: { id: string; store: VirtualStore }): string | null {
  const relativePath = fromResolvedId(id)
  if (relativePath === null) return null
  return store.map.get(relativePath) ?? null
}

/** Relative paths whose content changed, appeared, or vanished between two stores, for targeted HMR. */
export function diffStores(prev: VirtualStore | null, next: VirtualStore): Set<string> {
  const affected = new Set<string>()
  const keys = new Set([...(prev?.map.keys() ?? []), ...next.map.keys()])
  for (const key of keys) {
    if (prev?.map.get(key) !== next.map.get(key)) affected.add(key)
  }
  return affected
}
