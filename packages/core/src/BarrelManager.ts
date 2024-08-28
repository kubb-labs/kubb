import { join } from 'node:path'

import { TreeNode } from './utils/TreeNode.ts'

import { getRelativePath } from '@kubb/fs'
import type * as KubbFile from '@kubb/fs/types'
import { combineExports } from './FileManager.ts'
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

    const files = TreeNode.build(generatedFiles, root)
      ?.map((treeNode) => {
        if (!treeNode || !treeNode.children || !treeNode.parent?.data.path) {
          return undefined
        }

        const barrelPath: KubbFile.Path = join(treeNode.parent?.data.path, 'index.ts')

        const leaves = treeNode.leaves

        // biome-ignore lint/complexity/useFlatMap: we have a custom map in TreeNode
        const exports = leaves
          .map((item) => {
            if (!item.data.name) {
              return undefined
            }

            const sources = item.data.file?.sources || []

            if (!sources.some((source) => source.isExportable)) {
              logger?.emit(
                'warning',
                `No exportable source found(source should have a name and isExportable):\nFile: ${JSON.stringify(item.data.file, undefined, 2)}`,
              )
            }

            return sources.map((source) => {
              if (!item.data.file?.path || !source.isExportable) {
                return undefined
              }

              // true when we have a subdirectory that also contains barrel files
              const isSubExport = !!treeNode.parent?.data.path?.split?.('/')?.length

              if (isSubExport) {
                return {
                  name: [source.name],
                  path: getRelativePath(treeNode.parent?.data.path, item.data.path),
                  isTypeOnly: source.isTypeOnly,
                } as KubbFile.Export
              }

              return {
                name: [source.name],
                path: `./${item.data.file.baseName}`,
                isTypeOnly: source.isTypeOnly,
              } as KubbFile.Export
            })
          })
          .flat()
          .filter(Boolean)

        const combinedExports = combineExports(exports)

        const barrelFile: KubbFile.File = {
          path: barrelPath,
          baseName: 'index.ts',
          exports: combinedExports,
          sources: combinedExports.flatMap((item) => {
            if (Array.isArray(item.name)) {
              return item.name.map((name) => {
                return {
                  name: name,
                  isTypeOnly: item.isTypeOnly,
                  //TODO use parser to generate import
                  value: '',
                  isExportable: false,
                } as KubbFile.Source
              })
            }
            return [
              {
                name: item.name,
                isTypeOnly: item.isTypeOnly,
                //TODO use parser to generate import
                value: '',
                isExportable: false,
              } as KubbFile.Source,
            ]
          }),
        }
        return barrelFile
      })
      .filter(Boolean)

    return files || []
  }
}
