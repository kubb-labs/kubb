import type { Plugin } from '@kubb/core'
import { mergeDeep } from 'remeda'
import type { JSONKubbConfig } from '~/types/agent.ts'
import { resolvePlugins } from './resolvePlugins.ts'

/**
 * Merges studio plugin options with disk config plugins.
 *
 * Strategy:
 * - If studio plugins provided, they override/extend their counterparts from disk config
 * - Disk config plugins without studio overrides are preserved
 * - Plugin options are deeply merged, with studio options taking priority
 * - If only studio plugins (no disk), they are resolved and returned
 *
 * @param diskPlugins - Plugins loaded from kubb.config.ts (disk)
 * @param studioPlugins - Plugin entries from studio payload (can be undefined)
 * @returns Merged/resolved plugin array, or undefined if no plugins at all
 */
export function mergePlugins(diskPlugins: Array<Plugin> | undefined, studioPlugins: JSONKubbConfig['plugins'] | undefined): Array<Plugin> | undefined {
  // No disk plugins and no studio plugins = undefined
  if (!diskPlugins && !studioPlugins) {
    return undefined
  }

  // Only disk plugins = use them as-is
  if (!studioPlugins) {
    return diskPlugins
  }

  // Only studio plugins, no disk = resolve and return them
  if (!diskPlugins) {
    return resolvePlugins(studioPlugins)
  }

  // Both exist — merge them
  // Create a map of studio plugins by name for quick lookup
  const studioMap = new Map(studioPlugins.map((p) => [p.name, p]))

  // Start with disk plugins and override with studio versions where they exist
  const merged: Array<Plugin> = diskPlugins.map((diskPlugin) => {
    const studioPlugin = studioMap.get(diskPlugin.name)

    if (!studioPlugin) {
      // No studio override for this disk plugin — keep it as-is
      return diskPlugin
    }

    // Merge options: studio options override disk options using remeda
    const mergedOptions = mergeDeep(diskPlugin.options, studioPlugin.options)

    // Return a new plugin with merged options
    return {
      ...diskPlugin,
      options: mergedOptions,
    } as Plugin
  })

  // Resolve any studio plugins that weren't in disk config and add them
  const diskPluginNames = new Set(diskPlugins.map((p) => p.name))
  const newStudioPlugins = studioPlugins.filter((p) => !diskPluginNames.has(p.name))

  if (newStudioPlugins.length > 0) {
    merged.push(...resolvePlugins(newStudioPlugins))
  }

  return merged
}
