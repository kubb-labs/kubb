import { resolve } from 'node:path'
import type { FileNode } from '@kubb/ast'
import type { Config, NormalizedPlugin } from '@kubb/core'
import type { BarrelType } from '../types.ts'
import { getBarrelFiles } from './getBarrelFiles.ts'

export type GeneratePerPluginBarrelParams = {
  /**
   * Re-export style used in the plugin's barrel file(s).
   */
  barrelType: BarrelType
  /**
   * Plugin whose `output.path` determines the barrel directory.
   */
  plugin: NormalizedPlugin
  /**
   * Full set of generated files across all plugins.
   * Files outside the plugin's output directory are filtered out automatically.
   */
  files: ReadonlyArray<FileNode>
  /**
   * Resolved Kubb config; used to compute the absolute output directory.
   */
  config: Config
}

/**
 * Generates barrel files for a single plugin's output directory.
 *
 * The barrel is placed at `<config.root>/<config.output.path>/<plugin.options.output.path>/index.ts`.
 * When the plugin uses `group`, additional sub-directory barrels are generated so that grouped
 * output (e.g. `petController/index.ts`) gets its own re-export entry point.
 */
export function generatePerPluginBarrel({ barrelType, plugin, files, config }: GeneratePerPluginBarrelParams): Array<FileNode> {
  const outputPath = resolve(config.root, config.output.path, plugin.options.output.path)

  return getBarrelFiles({ outputPath, files, barrelType, recursive: true })
}
