import { extname, join } from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { BarrelManager } from './BarrelManager.ts'
import type { Logger } from './logger.ts'
import type { BarrelType, Plugin } from './types.ts'

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
  logger?: Logger

  meta?: FileMetaBase
}

export function getMode(path: string | undefined | null): KubbFile.Mode {
  if (!path) {
    return 'split'
  }
  return extname(path) ? 'single' : 'split'
}

function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
}

export async function getBarrelFiles(
  files: Array<KubbFile.ResolvedFile>,
  { type, meta = {}, root, output, logger }: AddIndexesProps,
): Promise<KubbFile.File[]> {
  if (!type || type === 'propagate') {
    return []
  }

  const barrelManager = new BarrelManager({ logger })

  const pathToBuildFrom = join(root, output.path)

  if (trimExtName(pathToBuildFrom).endsWith('index')) {
    logger?.emit('warning', 'Output has the same fileName as the barrelFiles, please disable barrel generation')

    return []
  }

  const barrelFiles = barrelManager.getFiles({ files, root: pathToBuildFrom, meta })

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
