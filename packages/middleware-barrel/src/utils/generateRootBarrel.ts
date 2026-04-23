import { resolve } from 'node:path'
import type { FileNode } from '@kubb/ast'
import type { Config } from '@kubb/core'
import type { BarrelType } from '../types.ts'
import { getBarrelFiles } from './getBarrelFiles.ts'

export type GenerateRootBarrelParams = {
  barrelType: BarrelType
  files: ReadonlyArray<FileNode>
  config: Config
}

/**
 * Generates a root barrel file at `resolve(config.root, config.output.path)/index.ts`.
 *
 * The root barrel re-exports from all files across all plugins that are located
 * inside the root output directory, using the given `barrelType` strategy.
 *
 * In practice this re-exports the per-plugin barrels when `barrelType = 'propagate'`,
 * or all individual files when `barrelType = 'all'` or `'named'`.
 */
export function generateRootBarrel({ barrelType, files, config }: GenerateRootBarrelParams): Array<FileNode> {
  const outputPath = resolve(config.root, config.output.path)
  return getBarrelFiles(outputPath, files, barrelType)
}
