import { join } from 'node:path'

import { TreeNode } from './utils/TreeNode.ts'

import { getRelativePath } from '@kubb/fs'
import type * as KubbFile from '@kubb/fs/types'
import { combineExports, combineSources } from './FileManager.ts'
import type { Logger } from './logger.ts'

export type BarrelManagerOptions = {
  logger?: Logger
}

export class BarrelManager {
  #options: BarrelManagerOptions

  constructor(options: BarrelManagerOptions = {}) {
    this.#options = options

    return this
  }

  getFiles(generatedFiles: KubbFile.File[], root?: string): Array<KubbFile.File> {
    const { logger } = this.#options

    const cachedFiles = new Map<KubbFile.Path, KubbFile.File>()

    logger?.emit('debug', { date: new Date(), logs: [`Start barrel generation for root: ${root}`] })

    TreeNode.build(generatedFiles, root)?.forEach((treeNode) => {
      if (!treeNode || !treeNode.children || !treeNode.parent?.data.path) {
        return undefined
      }

      const barrelFile: KubbFile.File = {
        path: join(treeNode.parent?.data.path, 'index.ts') as KubbFile.Path,
        baseName: 'index.ts',
        exports: [],
        sources: [],
      }
      const previousBarrelFile = cachedFiles.get(barrelFile.path)
      const leaves = treeNode.leaves

      leaves.forEach((item) => {
        if (!item.data.name) {
          return undefined
        }

        const sources = item.data.file?.sources || []

        if (!sources.some((source) => source.isIndexable)) {
          logger?.emit(
            'warning',
            `No isIndexable source found(source should have a name and isIndexable):\nFile: ${JSON.stringify(item.data.file, undefined, 2)}`,
          )
        }

        sources.forEach((source) => {
          if (!item.data.file?.path || !source.isIndexable || !source.name) {
            return undefined
          }
          const alreadyContainInPreviousBarrelFile = previousBarrelFile?.sources.some((item) => item.name === source.name)

          if (alreadyContainInPreviousBarrelFile) {
            return undefined
          }

          if (!barrelFile.exports) {
            barrelFile.exports = []
          }

          // true when we have a subdirectory that also contains barrel files
          const isSubExport = !!treeNode.parent?.data.path?.split?.('/')?.length

          if (isSubExport) {
            barrelFile.exports.push({
              name: [source.name],
              path: getRelativePath(treeNode.parent?.data.path, item.data.path),
              isTypeOnly: source.isTypeOnly,
            })
          } else {
            barrelFile.exports.push({
              name: [source.name],
              path: `./${item.data.file.baseName}`,
              isTypeOnly: source.isTypeOnly,
            })
          }

          barrelFile.sources.push({
            name: source.name,
            isTypeOnly: source.isTypeOnly,
            //TODO use parser to generate import
            value: '',
            isExportable: false,
            isIndexable: false,
          })
        })
      })

      logger?.emit('debug', { date: new Date(), logs: [`Generating barrelFile(${barrelFile.path}) for: ${treeNode.data?.path}`] })

      if (previousBarrelFile) {
        previousBarrelFile.sources.push(...barrelFile.sources)
        previousBarrelFile.exports?.push(...(barrelFile.exports || []))
        // cachedFiles.set(barrelFile.path, {
        //   ...previousBarrelFile,
        //   ...barrelFile,
        //   exports: combineExports([...(previousBarrelFile.exports || []), ...(barrelFile.exports || [])]),
        //   sources: combineSources([...(previousBarrelFile.sources || []), ...(barrelFile.sources || [])]),
        // })
      } else {
        cachedFiles.set(barrelFile.path, barrelFile)
      }
    })

    return [...cachedFiles.values()]
  }
}
