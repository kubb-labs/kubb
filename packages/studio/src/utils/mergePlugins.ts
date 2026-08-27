import type { Plugin } from 'kubb/kit'
import { mergeDeep } from 'remeda'
import type { JSONKubbConfig } from '../protocol/index.ts'
import { resolvePlugins, toPluginName } from './resolvePlugins.ts'

/**
 * Rejects a Studio payload naming a module specifier outside `allowed`.
 *
 * `resolvePlugins` resolves a plugin by `await import(name)`, so an unrestricted payload can
 * execute any module reachable from the project. The Docker image bounds this by shipping a fixed
 * plugin set; a host running in the user's own project passes the specifiers its disk config
 * already imports instead. An `undefined` allow-list means no restriction.
 */
export function assertAllowedPlugins(studioPlugins: JSONKubbConfig['plugins'] | undefined, allowed: ReadonlyArray<string> | undefined): void {
  if (!allowed || !studioPlugins?.length) {
    return
  }

  const allowedNames = new Set(allowed.map(toPluginName))
  const rejected = studioPlugins.map((plugin) => plugin.name).filter((name) => !allowedNames.has(toPluginName(name)))

  if (rejected.length) {
    throw new Error(
      `Kubb Studio asked to load ${rejected.map((name) => `"${name}"`).join(', ')}, which the local Kubb config does not import. ` +
        'Add the plugin to your config and reconnect.',
    )
  }
}

/**
 * Merges studio plugin options with disk config plugins.
 * Studio takes priority: options from studio win over disk, and a plugin Studio explicitly
 * disabled is dropped even when the disk config still lists it. Disk plugins without a studio
 * counterpart are kept as-is. Studio plugins not present on disk are appended.
 *
 * For plugins present in both configs, the plugin is re-instantiated with merged options
 * so that all internal closures correctly reference the merged values.
 */
export async function mergePlugins(
  diskPlugins: Array<Plugin> | undefined,
  studioPlugins: JSONKubbConfig['plugins'] | undefined,
  disabledPlugins?: JSONKubbConfig['disabledPlugins'],
): Promise<Array<Plugin> | undefined> {
  const disabledNames = new Set((disabledPlugins ?? []).map(toPluginName))
  const activeDiskPlugins = disabledNames.size ? diskPlugins?.filter((plugin) => !disabledNames.has(plugin.name)) : diskPlugins

  if (!activeDiskPlugins && !studioPlugins) return undefined
  if (!studioPlugins) return activeDiskPlugins

  // Resolve studio JSON entries into Plugin objects so names are consistent (e.g. 'plugin-oas')
  const resolvedStudio = await resolvePlugins(studioPlugins)

  if (!activeDiskPlugins) return resolvedStudio

  // Map from resolved plugin name → original studio entry (needed to re-instantiate with merged options)
  const studioEntryByResolvedName = new Map<string, NonNullable<JSONKubbConfig['plugins']>[0]>()
  resolvedStudio.forEach((resolved, i) => {
    const entry = studioPlugins[i]
    if (entry) {
      studioEntryByResolvedName.set(resolved.name, entry)
    }
  })

  const diskNames = new Set(activeDiskPlugins.map((p) => p.name))

  const mergedDisk = await Promise.all(
    activeDiskPlugins.map(async (diskPlugin) => {
      const studioEntry = studioEntryByResolvedName.get(diskPlugin.name)
      if (!studioEntry) return diskPlugin

      // Merge options (disk as base, studio overrides), then re-instantiate the plugin
      // so that all internal closures reference the correctly merged options. A plugin
      // that never sets `options` on its returned object (e.g. `@kubb/plugin-barrel`)
      // leaves `diskPlugin.options` undefined, which `mergeDeep` can't accept.
      const mergedOptions = mergeDeep((diskPlugin.options as Record<string, unknown>) ?? {}, (studioEntry.options as Record<string, unknown>) ?? {})
      const resolved = await resolvePlugins([{ name: studioEntry.name, options: mergedOptions }])
      return resolved[0] ?? diskPlugin
    }),
  )

  const studioOnly = resolvedStudio.filter((p) => !diskNames.has(p.name))

  return [...mergedDisk, ...studioOnly]
}
