import { resolve } from 'node:path'
import type { FileNode } from '@kubb/ast'
import type { Config } from '@kubb/core'
import type { BarrelType } from '../types.ts'
import { getBarrelFiles } from './getBarrelFiles.ts'

export type GenerateRootBarrelParams = {
  /**
   * Re-export style used in the root barrel file.
   */
  barrelType: BarrelType
  /**
   * Files eligible for re-export. The middleware filters out files belonging to plugins
   * with `barrelType: false` before passing them in.
   */
  files: ReadonlyArray<FileNode>
  /**
   * Resolved Kubb config; used to compute the root output directory.
   */
  config: Config
}

/**
 * Generates the root barrel file at `<config.root>/<config.output.path>/index.ts`.
 *
 * Unlike `generatePerPluginBarrel`, this does not recurse into sub-directories — each
 * plugin is responsible for its own per-plugin barrels.
 */
export function generateRootBarrel({ barrelType, files, config }: GenerateRootBarrelParams): Array<FileNode> {
  const outputPath = resolve(config.root, config.output.path)

  return getBarrelFiles({ outputPath, files, barrelType })
}
