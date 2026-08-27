import type { Adapter } from 'kubb/kit'
import { mergeDeep } from 'remeda'
import { toExportName } from './resolvePlugins.ts'

/**
 * Merges Studio-provided adapter option overrides into the disk config's adapter.
 *
 * Adapter instances carry live functions (`parse`, `getImports`, ...) that can't survive
 * JSON serialization over the WebSocket, so `studioOptions` is treated as an options patch
 * rather than a replacement adapter. Re-invokes the same `@kubb/adapter-<name>` factory the
 * disk config used, with the merged options, so the resulting instance has fresh closures
 * over the merged values instead of a plain object missing `parse`.
 */
export async function mergeAdapter(diskAdapter: Adapter | undefined, studioOptions: object | undefined): Promise<Adapter | undefined> {
  if (!studioOptions || !diskAdapter) {
    return diskAdapter
  }

  const packageName = `@kubb/adapter-${diskAdapter.name}`
  const mod = (await import(packageName)) as Record<string, unknown>
  const factory = mod[toExportName(packageName)]

  if (typeof factory !== 'function') {
    return diskAdapter
  }

  const mergedOptions = mergeDeep(diskAdapter.options as Record<string, unknown>, studioOptions as Record<string, unknown>)

  return factory(mergedOptions) as Adapter
}
