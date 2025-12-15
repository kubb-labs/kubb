import { join } from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { BarrelManager } from '../BarrelManager.ts'
import type { BarrelType, Plugin } from '../types.ts'

export type FileMetaBase = {
  pluginKey?: Plugin['key']
}

type AddIndexesProps = {
  type: BarrelType | false | undefined
  /**
   * Root based on root and output.path specified in the config
   */
  root: string
  /**
   * Output for plugin
   */
  output: {
    path: string
  }
  group?: {
    output: string
    exportAs: string
  }

  meta?: FileMetaBase
}

function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
}

export async function getBarrelFiles(files: Array<KubbFile.ResolvedFile>, { type, meta = {}, root, output }: AddIndexesProps): Promise<KubbFile.File[]> {
  if (!type || type === 'propagate') {
    return []
  }

  const barrelManager = new BarrelManager({})

  const pathToBuildFrom = join(root, output.path)

  if (trimExtName(pathToBuildFrom).endsWith('index')) {
    return []
  }

  const barrelFiles = barrelManager.getFiles({
    files,
    root: pathToBuildFrom,
    meta,
  })

  if (type === 'all') {
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
