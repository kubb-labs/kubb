import type { HookStylePlugin } from '@kubb/core'
import { mergeDeep } from 'remeda'
import type { JSONKubbConfig } from '~/types/agent.ts'
import { resolvePlugins } from './resolvePlugins.ts'

/**
 * Merges studio plugin options with disk config plugins.
 * Studio options take priority; disk plugins without a studio counterpart are kept as-is.
 * Studio plugins not present on disk are appended.
 *
 * For plugins present in both configs, the plugin is re-instantiated with merged options
 * so that all internal closures correctly reference the merged values.
 */
export async function mergePlugins(
  diskPlugins: Array<HookStylePlugin> | undefined,
  studioPlugins: JSONKubbConfig['plugins'] | undefined,
): Promise<Array<HookStylePlugin> | undefined> {
  if (!diskPlugins && !studioPlugins) return undefined
  if (!studioPlugins) return diskPlugins

  // Resolve studio JSON entries into Plugin objects so names are consistent (e.g. 'plugin-oas')
  const resolvedStudio = await resolvePlugins(studioPlugins)

  if (!diskPlugins) return resolvedStudio

  // Map from resolved plugin name → original studio entry (needed to re-instantiate with merged options)
  const studioEntryByResolvedName = new Map<string, NonNullable<JSONKubbConfig['plugins']>[0]>()
  resolvedStudio.forEach((resolved, i) => {
    const entry = studioPlugins[i]
    if (entry) {
      studioEntryByResolvedName.set(resolved.name, entry)
    }
  })

  const diskNames = new Set(diskPlugins.map((p) => p.name))

  const mergedDisk = await Promise.all(
    diskPlugins.map(async (diskPlugin) => {
      const studioEntry = studioEntryByResolvedName.get(diskPlugin.name)
      if (!studioEntry) return diskPlugin

      // Merge options (disk as base, studio overrides), then re-instantiate the plugin
      // so that all internal closures reference the correctly merged options.
      const mergedOptions = mergeDeep(diskPlugin.options as Record<string, unknown>, studioEntry.options as Record<string, unknown>)
      const resolved = await resolvePlugins([{ name: studioEntry.name, options: mergedOptions }])
      return resolved[0] ?? diskPlugin
    }),
  )

  const studioOnly = resolvedStudio.filter((p) => !diskNames.has(p.name))

  return [...mergedDisk, ...studioOnly]
}
