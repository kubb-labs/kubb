import type { Plugin } from '@kubb/core'
import { mergeDeep } from 'remeda'
import type { JSONKubbConfig } from '~/types/agent.ts'
import { resolvePlugins } from './resolvePlugins.ts'

/**
 * Merges studio plugin options with disk config plugins.
 * Studio options take priority; disk plugins without a studio counterpart are kept as-is.
 * Studio plugins not present on disk are appended.
 */
export function mergePlugins(diskPlugins: Array<Plugin> | undefined, studioPlugins: JSONKubbConfig['plugins'] | undefined): Array<Plugin> | undefined {
  if (!diskPlugins && !studioPlugins) return undefined
  if (!studioPlugins) return diskPlugins

  // Resolve studio JSON entries into Plugin objects so names are consistent (e.g. 'plugin-oas')
  const resolvedStudio = resolvePlugins(studioPlugins)

  if (!diskPlugins) return resolvedStudio

  const studioByName = new Map(resolvedStudio.map((p) => [p.name, p]))
  const diskNames = new Set(diskPlugins.map((p) => p.name))

  const mergedDisk = diskPlugins.map((diskPlugin) => {
    const studioPlugin = studioByName.get(diskPlugin.name)
    if (!studioPlugin) return diskPlugin

    return { ...diskPlugin, options: mergeDeep(diskPlugin.options, studioPlugin.options) } as Plugin
  })

  const studioOnly = resolvedStudio.filter((p) => !diskNames.has(p.name))

  return [...mergedDisk, ...studioOnly]
}
