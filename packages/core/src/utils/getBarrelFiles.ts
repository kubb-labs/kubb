import { join } from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { BarrelManager } from '../BarrelManager.ts'
import type { Barrel, BarrelType, Plugin } from '../types.ts'
import { resolveBarrelType } from './resolveBarrelType.ts'

export type FileMetaBase = {
  pluginKey?: Plugin['key']
}

type AddIndexesProps = {
  /**
   * Explicit barrel strategy. When omitted it is resolved from `output.barrel` (preferred) or the legacy `output.barrelType`.
   */
  type?: BarrelType | false
  /**
   * Root based on root and output.path specified in the config
   */
  root: string
  /**
   * Output for plugin
   */
  output: {
    path: string
    barrel?: Barrel | false
    barrelType?: BarrelType | false
  }
  group?: {
    output: string
    exportAs: string
  }

  meta?: FileMetaBase
}

function trimExtName(text: string): string {
  const dotIndex = text.lastIndexOf('.')
  // Only strip when the dot is found and no path separator follows it
  // (guards against stripping dots that are part of a directory name like /project.v2/gen)
  if (dotIndex > 0 && !text.includes('/', dotIndex)) {
    return text.slice(0, dotIndex)
  }
  return text
}

export async function getBarrelFiles(files: Array<KubbFile.ResolvedFile>, { type, meta = {}, root, output }: AddIndexesProps): Promise<KubbFile.File[]> {
  const resolvedType = type ?? resolveBarrelType(output) ?? 'named'

  if (!resolvedType || resolvedType === 'propagate') {
    return []
  }

  const barrelManager = new BarrelManager()

  const pathToBuildFrom = join(root, output.path)

  if (trimExtName(pathToBuildFrom).endsWith('index')) {
    return []
  }

  const barrelFiles = barrelManager.getFiles({
    files,
    root: pathToBuildFrom,
    meta,
  })

  if (resolvedType === 'all') {
    return barrelFiles.map((file) => {
      return {
        ...file,
        exports: file.exports?.map((exportItem) => {
          return {
            ...exportItem,
            name: undefined,
          }
        }),
      }
    })
  }

  return barrelFiles.map((indexFile) => {
    return {
      ...indexFile,
      meta,
    }
  })
}
